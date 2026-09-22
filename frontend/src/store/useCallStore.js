import { create } from "zustand";
import { useAuthStore } from "./useAuthStore.js";
import toast from "react-hot-toast";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ],
};

let pendingCandidates = [];

export const useCallStore = create((set, get) => ({
  callStatus: "idle", // idle, calling, receiving, inCall
  callType: "audio", // audio, video
  caller: null,
  callee: null,
  peer: null, // RTCPeerConnection instance
  localStream: null,
  remoteStream: null,
  isCameraOff: false,

  handleIceCandidate: async (candidate) => {
    if (!candidate) return;
    const { peer } = get();
    if (peer && peer.remoteDescription && peer.remoteDescription.type) {
      try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn("[Call] Error adding ice candidate:", e);
      }
    } else {
      pendingCandidates.push(candidate);
    }
  },

  callUser: async (userToCall, type = "audio") => {
    try {
      const socket = useAuthStore.getState().socket;
      const authUser = useAuthStore.getState().authUser;

      if (!socket || !socket.connected) {
        toast.error("Not connected to server");
        return;
      }

      const targetUserId = (userToCall._id || userToCall.id)?.toString();
      if (!targetUserId) {
        toast.error("User ID not found");
        return;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("المتصفح لا يدعم المايك/الكاميرا أو الموقع ليس HTTPS");
        return;
      }

      const isVideo = type === "video";

      // 1. Request microphone and optional camera access with ideal mobile constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo
          ? {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: { ideal: "user" },
            }
          : false,
      });

      set({
        localStream: stream,
        callStatus: "calling",
        callee: userToCall,
        callType: type,
        isCameraOff: false,
      });
      pendingCandidates = [];

      // 2. Create RTCPeerConnection
      const pc = new RTCPeerConnection(ICE_SERVERS);

      // Add local audio & video tracks
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Handle remote audio & video stream
      pc.ontrack = (event) => {
        console.log("[Call] Remote stream track received:", event.track.kind);
        if (event.streams && event.streams[0]) {
          set({ remoteStream: event.streams[0] });
        }
      };

      // Send local ICE candidates to callee
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("iceCandidate", { to: targetUserId, candidate: event.candidate });
        }
      };

      // Listen for answer
      socket.off("callAccepted");
      socket.on("callAccepted", async (signal) => {
        console.log("[Call] Call accepted, setting remote description");
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          set({ callStatus: "inCall" });

          // Process all queued ICE candidates
          while (pendingCandidates.length > 0) {
            const cand = pendingCandidates.shift();
            await pc.addIceCandidate(new RTCIceCandidate(cand)).catch((e) => console.warn(e));
          }
        } catch (e) {
          console.error("[Call] Error setting remote description:", e);
        }
      });

      // Create offer and send
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      console.log("[Call] Emitting callUser to:", targetUserId, "type:", type);
      socket.emit("callUser", {
        userToCall: targetUserId,
        signalData: offer,
        from: {
          ...authUser,
          callType: type,
        },
      });

      set({ peer: pc });
    } catch (err) {
      console.error("[Call] Failed to start call:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        toast.error("يرجى تفعيل إذن المايكروفون/الكاميرا من إعدادات المتصفح (علامة 🔒)");
      } else {
        toast.error("تعذر بدء المكالمة");
      }
      get().endCall(false);
    }
  },

  answerCall: async () => {
    try {
      const { caller } = get();
      const socket = useAuthStore.getState().socket;

      if (!caller || !socket) {
        toast.error("Call information missing");
        get().endCall(false);
        return;
      }

      const callerId = (caller._id || caller.id)?.toString();

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error("المتصفح لا يدعم المايك/الكاميرا أو الموقع ليس HTTPS");
        return;
      }

      const isVideo = caller.callType === "video";

      // 1. Request microphone and optional camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo
          ? {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: { ideal: "user" },
            }
          : false,
      });

      set({
        localStream: stream,
        callStatus: "inCall",
        callType: isVideo ? "video" : "audio",
        isCameraOff: false,
      });

      // 2. Create RTCPeerConnection
      const pc = new RTCPeerConnection(ICE_SERVERS);

      // Add local audio & video tracks
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Handle remote audio & video stream
      pc.ontrack = (event) => {
        console.log("[Call] Remote stream track received by callee:", event.track.kind);
        if (event.streams && event.streams[0]) {
          set({ remoteStream: event.streams[0] });
        }
      };

      // Send local ICE candidates to caller
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("iceCandidate", { to: callerId, candidate: event.candidate });
        }
      };

      // Set caller's offer as remote description
      await pc.setRemoteDescription(new RTCSessionDescription(caller.signal));

      // Process any queued candidates that arrived before user accepted
      while (pendingCandidates.length > 0) {
        const cand = pendingCandidates.shift();
        await pc.addIceCandidate(new RTCIceCandidate(cand)).catch((e) => console.warn(e));
      }

      // Create answer and send
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      console.log("[Call] Emitting answerCall to:", callerId);
      socket.emit("answerCall", { to: callerId, signal: answer });

      set({ peer: pc });
    } catch (err) {
      console.error("[Call] Failed to answer call:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        toast.error("يرجى تفعيل إذن المايكروفون/الكاميرا من إعدادات المتصفح (علامة 🔒)");
      } else {
        toast.error("تعذر الرد على المكالمة");
      }
      get().endCall(false);
    }
  },

  toggleCamera: () => {
    const { localStream, isCameraOff } = get();
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isCameraOff;
        set({ isCameraOff: !isCameraOff });
      }
    }
  },

  endCall: (emitEvent = true) => {
    const { peer, localStream, remoteStream, caller, callee } = get();

    if (peer) {
      try {
        peer.close();
      } catch (e) {
        console.warn(e);
      }
    }
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop());
    }

    const socket = useAuthStore.getState().socket;
    const otherUser = callee || caller;
    const targetId = (otherUser?._id || otherUser?.id)?.toString();

    if (emitEvent && socket && targetId) {
      socket.emit("endCall", { to: targetId });
    }

    if (socket) {
      socket.off("callAccepted");
    }

    pendingCandidates = [];

    set({
      callStatus: "idle",
      callType: "audio",
      caller: null,
      callee: null,
      peer: null,
      localStream: null,
      remoteStream: null,
      isCameraOff: false,
    });
  },

  setIncomingCall: (callerData) => {
    console.log("[Call] Incoming call from:", callerData?.fullName, "type:", callerData?.callType);
    set({
      callStatus: "receiving",
      caller: callerData,
      callType: callerData?.callType || "audio",
    });
  },
}));
