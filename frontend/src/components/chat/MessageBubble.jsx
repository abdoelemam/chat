import React, { useState, useRef } from "react";
import { formatMessageTime } from "../../lib/utils.js";
import { useAuthStore } from "../../store/useAuthStore.js";
import { useChatStore } from "../../store/useChatStore.js";
import { Play, Pause } from "lucide-react";

const VoiceNotePlayer = ({ src, isSentByMe }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn("Audio playback error:", err);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatTime = (time) => {
    if (isNaN(time) || !isFinite(time)) return "0:00";
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-3 py-1.5 min-w-[210px] max-w-[270px]">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      <button
        type="button"
        onClick={togglePlay}
        className={`btn btn-circle btn-sm shadow-md flex-shrink-0 ${
          isSentByMe
            ? "bg-white text-primary hover:bg-white/90 border-0"
            : "btn-primary text-white"
        }`}
        title={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </button>

      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <input
          type="range"
          min="0"
          max={duration || 100}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          className="range range-xs cursor-pointer"
        />
        <div
          className={`flex justify-between text-[11px] font-mono select-none ${
            isSentByMe ? "text-primary-content/80" : "text-base-content/70"
          }`}
        >
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

const MessageBubble = ({ message, isSentByMe }) => {
  const { authUser } = useAuthStore();
  const { selectedConversation } = useChatStore();

  // Handle populated senderId (object) vs unpopulated (string)
  const sender = typeof message.senderId === "object" ? message.senderId : null;

  let senderAvatar = "/avatar.png";
  let senderName = "";

  if (isSentByMe) {
    senderAvatar = authUser.profilePic || "/avatar.png";
  } else if (sender) {
    // Populated sender from group/direct message
    senderAvatar = sender.profilePic || "/avatar.png";
    senderName = sender.fullName || "";
  } else if (selectedConversation && !selectedConversation.groupName) {
    // Fallback for direct conversations
    const otherParticipant = selectedConversation.participants?.find(
      (p) => (p._id || p) !== (authUser._id || authUser.id)
    );
    senderAvatar = otherParticipant?.profilePic || "/avatar.png";
    senderName = otherParticipant?.fullName || "";
  }

  if (message.isSystem) {
    return (
      <div className="flex justify-center my-3">
        <span className="bg-base-200/90 text-base-content/70 border border-base-300 text-xs px-3.5 py-1.5 rounded-full shadow-sm text-center max-w-[85%] font-medium">
          {message.text}
        </span>
      </div>
    );
  }

  const isGroupChat = selectedConversation?.type === "group" || selectedConversation?.groupName;

  return (
    <div className={`chat ${isSentByMe ? "chat-end" : "chat-start"}`}>
      {!isSentByMe && (
        <div className="chat-image avatar hidden sm:block">
          <div className="w-8 h-8 rounded-full border border-base-300">
            <img src={senderAvatar} alt="avatar" />
          </div>
        </div>
      )}

      {isGroupChat && !isSentByMe && senderName && (
        <div className="chat-header mb-1 opacity-70 text-xs">
          <span className="font-semibold">{senderName}</span>
        </div>
      )}

      <div
        className={`chat-bubble max-w-[85%] sm:max-w-[70%] break-words
          ${isSentByMe ? "bg-primary text-primary-content" : "bg-base-200 text-base-content"}
        `}
      >
        {message.image && (
          <img
            src={message.image}
            alt="Attachment"
            className="sm:max-w-[200px] rounded-md mb-2 object-cover cursor-pointer"
            onClick={() => window.open(message.image, "_blank")}
          />
        )}

        {message.audio && (
          <VoiceNotePlayer src={message.audio} isSentByMe={isSentByMe} />
        )}

        {message.text && <p>{message.text}</p>}
      </div>

      <div className="chat-footer opacity-50 text-xs mt-1">
        {formatMessageTime(message.createdAt)}
      </div>
    </div>
  );
};

export default MessageBubble;
