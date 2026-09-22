import { create } from "zustand";
import { useAuthStore } from "./useAuthStore.js";
import Peer from "simple-peer";

export const useCallStore = create((set, get) => ({
  callStatus: "idle", // idle, calling, receiving, inCall
  caller: null,
  callee: null,
  peer: null,
  localStream: null,
  remoteStream: null,

  callUser: async (userToCall) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      set({ localStream: stream, callStatus: "calling", callee: userToCall });

      const socket = useAuthStore.getState().socket;
      
      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream,
      });

      peer.on("signal", (data) => {
        socket.emit("callUser", {
          userToCall: userToCall._id || userToCall.id,
          signalData: data,
          from: useAuthStore.getState().authUser,
        });
      });

      peer.on("stream", (currentStream) => {
        set({ remoteStream: currentStream });
      });

      socket.on("callAccepted", (signal) => {
        set({ callStatus: "inCall" });
        peer.signal(signal);
      });

      set({ peer });
    } catch (err) {
      console.error("Failed to get local stream", err);
    }
  },

  answerCall: async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      set({ localStream: stream, callStatus: "inCall" });

      const socket = useAuthStore.getState().socket;
      const { caller } = get();

      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream,
      });

      peer.on("signal", (data) => {
        socket.emit("answerCall", { signal: data, to: caller._id || caller.id });
      });

      peer.on("stream", (currentStream) => {
        set({ remoteStream: currentStream });
      });

      if (caller && caller.signal) {
        peer.signal(caller.signal);
      }

      set({ peer });
    } catch (err) {
      console.error("Failed to get local stream", err);
    }
  },

  endCall: () => {
    const { peer, localStream, remoteStream, caller, callee } = get();
    if (peer) peer.destroy();
    if (localStream) localStream.getTracks().forEach((track) => track.stop());
    if (remoteStream) remoteStream.getTracks().forEach((track) => track.stop());

    const socket = useAuthStore.getState().socket;
    const otherUser = callee || caller;
    if (socket && otherUser) {
      socket.emit("endCall", { to: otherUser._id || otherUser.id });
    }

    set({ callStatus: "idle", caller: null, callee: null, peer: null, localStream: null, remoteStream: null });
  },

  setIncomingCall: (callerData) => {
    set({ callStatus: "receiving", caller: callerData });
  },
}));
