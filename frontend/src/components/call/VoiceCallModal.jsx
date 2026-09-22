import React, { useEffect, useRef, useState } from "react";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import { useCallStore } from "../../store/useCallStore.js";

const VoiceCallModal = () => {
  const {
    callStatus,
    callType,
    caller,
    callee,
    localStream,
    remoteStream,
    isCameraOff,
    toggleCamera,
    endCall,
  } = useCallStore();

  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const audioRef = useRef(null);

  const isVideo = callType === "video";
  const targetUser = callee || caller;

  // Bind remote stream for both video and audio
  useEffect(() => {
    if (remoteStream) {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch((err) => console.warn("Remote video play error:", err));
      }
      if (audioRef.current) {
        audioRef.current.srcObject = remoteStream;
        audioRef.current.play().catch((err) => console.warn("Remote audio play error:", err));
      }
    }
  }, [remoteStream, isVideo, callStatus]);

  // Bind local stream for self video preview
  useEffect(() => {
    if (isVideo && localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch((e) => console.warn("Local video play error:", e));
    }
  }, [localStream, isVideo, callStatus]);

  // Timer
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
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isMuted;
        setIsMuted(!isMuted);
      }
    }
  };

  if (!targetUser) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md select-none overflow-hidden">
      {/* Audio element for voice calls */}
      <audio ref={audioRef} autoPlay />

      {isVideo ? (
        /* ================= VIDEO CALL VIEW ================= */
        <div className="relative w-full h-full flex flex-col justify-between p-4 sm:p-6">
          {/* Main Remote Video Container */}
          <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-neutral-900 overflow-hidden">
            {/* Remote video element ALWAYS rendered in DOM so ref is never null */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover sm:object-contain transition-opacity duration-300 ${
                callStatus === "inCall" && remoteStream ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            />

            {/* Calling / Connecting Placeholder */}
            {(!remoteStream || callStatus !== "inCall") && (
              <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-primary/40 animate-pulse shadow-2xl">
                  <img
                    src={targetUser.profilePic || "/avatar.png"}
                    alt={targetUser.fullName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h2 className="text-2xl font-bold text-white">{targetUser.fullName}</h2>
                <p className="text-white/60">
                  {callStatus === "calling" ? "Calling (Video)..." : "Connecting..."}
                </p>
              </div>
            )}
          </div>

          {/* Top Bar with user info & duration */}
          <div className="relative z-20 flex justify-between items-center bg-black/40 backdrop-blur-md px-4 py-2.5 rounded-full max-w-fit mx-auto border border-white/10">
            <div className="flex items-center gap-2 text-white">
              <span className="font-semibold text-sm">{targetUser.fullName}</span>
              <span className="opacity-40">•</span>
              <span className="text-xs font-mono opacity-80">
                {callStatus === "calling" ? "Calling..." : formatDuration(duration)}
              </span>
            </div>
          </div>

          {/* Local PIP Video (Self Preview) */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 w-28 h-40 sm:w-36 sm:h-52 rounded-2xl overflow-hidden border-2 border-primary/50 shadow-2xl bg-neutral-800">
            {isCameraOff && (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-neutral-900 text-white/60 p-2 text-center text-xs">
                <VideoOff className="w-6 h-6" />
                <span>Camera Off</span>
              </div>
            )}
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isCameraOff ? "hidden" : "block"}`}
            />
          </div>

          {/* Bottom Floating Controls */}
          <div className="relative z-20 flex justify-center items-center gap-4 sm:gap-6 bg-black/50 backdrop-blur-md px-6 py-3 rounded-full max-w-fit mx-auto border border-white/10 shadow-2xl">
            <button
              onClick={toggleMute}
              className={`btn btn-circle btn-md sm:btn-lg ${isMuted ? "btn-error" : "btn-neutral text-white"}`}
              title={isMuted ? "Unmute Mic" : "Mute Mic"}
            >
              {isMuted ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>

            <button
              onClick={toggleCamera}
              className={`btn btn-circle btn-md sm:btn-lg ${isCameraOff ? "btn-error" : "btn-neutral text-white"}`}
              title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
            >
              {isCameraOff ? <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Video className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>

            <button
              onClick={endCall}
              className="btn btn-circle btn-md sm:btn-lg btn-error hover:scale-105 transition-transform"
              title="End Call"
            >
              <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
      ) : (
        /* ================= AUDIO CALL VIEW ================= */
        <div className="flex flex-col items-center space-y-8 animate-in fade-in zoom-in duration-300">
          <div className="flex flex-col items-center space-y-4">
            <div
              className={`w-32 h-32 rounded-full overflow-hidden border-4 border-base-200 ${
                callStatus === "inCall"
                  ? "shadow-[0_0_30px_rgba(34,197,94,0.4)]"
                  : "animate-pulse"
              }`}
            >
              <img
                src={targetUser.profilePic || "/avatar.png"}
                alt="User"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white">{targetUser.fullName}</h2>
              <p className="text-white/60">
                {callStatus === "calling" ? "Calling (Voice)..." : formatDuration(duration)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={toggleMute}
              className={`btn btn-circle btn-lg ${isMuted ? "btn-error" : "btn-neutral text-white"}`}
              title={isMuted ? "Unmute Mic" : "Mute Mic"}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            <button
              onClick={endCall}
              className="btn btn-circle btn-lg btn-error hover:scale-110 transition-transform"
              title="End Call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceCallModal;
