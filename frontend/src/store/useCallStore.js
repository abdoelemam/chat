import { create } from "zustand";
import { useAuthStore } from "./useAuthStore.js";
import toast from "react-hot-toast";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

let pendingCandidates = [];

export const useCallStore = create((set, get) => ({
  callStatus: "idle", // idle, calling, receiving, inCall
  caller: null,
  callee: null,
  peer: null, // RTCPeerConnection instance
  localStream: null,
  remoteStream: null,

  callUser: async (userToCall) => {
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

      // 1. Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      set({ localStream: stream, callStatus: "calling", callee: userToCall });
      pendingCandidates = [];

      // 2. Create RTCPeerConnection
      const pc = new RTCPeerConnection(ICE_SERVERS);

      // Add local audio tracks
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Handle remote audio stream
      pc.ontrack = (event) => {
        console.log("[Call] Remote audio stream received");
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

          // Process queued ICE candidates
          while (pendingCandidates.length > 0) {
            const cand = pendingCandidates.shift();
            await pc.addIceCandidate(new RTCIceCandidate(cand)).catch((e) => console.warn(e));
          }
        } catch (e) {
          console.error("[Call] Error setting remote description:", e);
        }
      });

      // Listen for ICE candidates from callee
      socket.off("iceCandidate");
      socket.on("iceCandidate", async ({ candidate }) => {
        if (!candidate) return;
        try {
          if (pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } else {
            pendingCandidates.push(candidate);
          }
        } catch (e) {
          console.error("[Call] Error adding ICE candidate:", e);
        }
      });

      // Create offer and send
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      console.log("[Call] Emitting callUser to:", targetUserId);
      socket.emit("callUser", {
        userToCall: targetUserId,
        signalData: offer,
        from: authUser,
      });

      set({ peer: pc });
    } catch (err) {
      console.error("[Call] Failed to start call:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        toast.error("Microphone permission denied");
      } else {
        toast.error("Could not start call");
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

      // 1. Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      set({ localStream: stream, callStatus: "inCall" });
      pendingCandidates = [];

      // 2. Create RTCPeerConnection
      const pc = new RTCPeerConnection(ICE_SERVERS);

      // Add local audio tracks
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Handle remote audio stream
      pc.ontrack = (event) => {
        console.log("[Call] Remote audio stream received by callee");
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

      // Listen for ICE candidates from caller
      socket.off("iceCandidate");
      socket.on("iceCandidate", async ({ candidate }) => {
        if (!candidate) return;
        try {
          if (pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } else {
            pendingCandidates.push(candidate);
          }
        } catch (e) {
          console.error("[Call] Error adding ICE candidate:", e);
        }
      });

      // Set caller's offer as remote description
      await pc.setRemoteDescription(new RTCSessionDescription(caller.signal));

      // Process any queued candidates
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
        toast.error("Microphone permission denied");
      } else {
        toast.error("Could not answer call");
      }
      get().endCall(false);
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
      socket.off("iceCandidate");
    }

    pendingCandidates = [];

    set({
      callStatus: "idle",
      caller: null,
      callee: null,
      peer: null,
      localStream: null,
      remoteStream: null,
    });
  },

  setIncomingCall: (callerData) => {
    console.log("[Call] Incoming call from:", callerData?.fullName);
    set({ callStatus: "receiving", caller: callerData });
  },
}));
