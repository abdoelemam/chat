import React, { useEffect } from "react";
import { Phone, PhoneOff } from "lucide-react";
import { useCallStore } from "../../store/useCallStore.js";
import { soundService } from "../../lib/sound.js";

const IncomingCallModal = () => {
  const { caller, answerCall, endCall } = useCallStore();

  useEffect(() => {
    soundService.startRingtone();
    return () => {
      soundService.stopRingtone();
    };
  }, []);

  if (!caller) return null;

  return (
    <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-right fade-in duration-300">
      <div className="bg-base-100 shadow-2xl rounded-2xl p-4 flex items-center gap-4 border border-base-300 min-w-[300px]">
        <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 animate-pulse bg-primary/20 p-1">
          <img src={caller.profilePic || "/avatar.png"} alt="Caller" className="w-full h-full rounded-full object-cover" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-bold truncate">{caller.fullName}</h3>
          <p className="text-xs text-base-content/60">Incoming voice call...</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={endCall}
            className="btn btn-circle btn-sm btn-error"
            title="Decline"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
          <button
            onClick={answerCall}
            className="btn btn-circle btn-sm btn-success animate-bounce text-white"
            title="Accept"
          >
            <Phone className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
