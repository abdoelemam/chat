import React from "react";
import { formatMessageTime } from "../../lib/utils.js";
import { useAuthStore } from "../../store/useAuthStore.js";
import { useChatStore } from "../../store/useChatStore.js";

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
        {message.text && <p>{message.text}</p>}
      </div>

      <div className="chat-footer opacity-50 text-xs mt-1">
        {formatMessageTime(message.createdAt)}
      </div>
    </div>
  );
};

export default MessageBubble;
