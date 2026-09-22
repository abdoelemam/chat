import React, { useEffect, useRef, useState } from "react";
import { Mic, MicOff, PhoneOff } from "lucide-react";
import { useCallStore } from "../../store/useCallStore.js";

const VoiceCallModal = () => {
  const { callStatus, caller, callee, localStream, remoteStream, endCall } = useCallStore();
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current && remoteStream) {
      audioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    let interval;
    if (callStatus === "inCall") {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks()[0].enabled = isMuted;
      setIsMuted(!isMuted);
    }
  };

  const targetUser = callee || caller; // If I'm calling, show callee. If receiving and accepted, show caller.
  if (!targetUser) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md">
      <audio ref={audioRef} autoPlay />
      
      <div className="flex flex-col items-center space-y-8 animate-in fade-in zoom-in duration-300">
        <div className="flex flex-col items-center space-y-4">
          <div className={`w-32 h-32 rounded-full overflow-hidden border-4 border-base-200 ${callStatus === "inCall" ? "shadow-[0_0_30px_rgba(34,197,94,0.4)]" : "animate-pulse"}`}>
            <img src={targetUser.profilePic || "/avatar.png"} alt="User" className="w-full h-full object-cover" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white">{targetUser.fullName}</h2>
            <p className="text-white/60">
              {callStatus === "calling" ? "Calling..." : formatDuration(duration)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={toggleMute}
            className={`btn btn-circle btn-lg ${isMuted ? "btn-error" : "btn-neutral"}`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
          
          <button
            onClick={endCall}
            className="btn btn-circle btn-lg btn-error hover:scale-110 transition-transform"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceCallModal;
