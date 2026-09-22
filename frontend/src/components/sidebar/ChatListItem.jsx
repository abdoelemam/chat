import React from "react";
import { useAuthStore } from "../../store/useAuthStore.js";
import { formatDate } from "../../lib/utils.js";

const ChatListItem = ({ conversation, isSelected, onClick }) => {
  const { onlineUsers, authUser } = useAuthStore();
  const isGroup = conversation?.type === "group" || !!conversation?.groupName;

  // Extract display info based on data shape
  let name = "";
  let avatar = "/avatar.png";
  let userId = null;

  if (isGroup) {
    name = conversation.groupName || "Group";
    avatar = conversation.groupAvatar || "/avatar.png";
  } else if (conversation?.fullName) {
    // It's a User object (from Users tab)
    name = conversation.fullName;
    avatar = conversation.profilePic || "/avatar.png";
    userId = conversation._id || conversation.id;
  } else if (conversation?.participants) {
    // It's a Conversation object (from Chats tab) with populated participants
    const other = conversation.participants.find((p) => {
      const pId = typeof p === "object" ? (p._id || p.id) : p;
      const myId = authUser._id || authUser.id;
      return pId?.toString() !== myId?.toString();
    });
    if (other && typeof other === "object") {
      name = other.fullName || "User";
      avatar = other.profilePic || "/avatar.png";
      userId = other._id || other.id;
    } else {
      name = "User";
      userId = other;
    }
  }

  const isOnline = !isGroup && userId && onlineUsers.includes(userId.toString ? userId.toString() : userId);

  return (
    <button
      onClick={onClick}
      className={`w-full p-3 flex items-center gap-3 hover:bg-base-200 transition-colors
        ${isSelected ? "bg-base-200 ring-1 ring-base-300" : ""}
      `}
    >
      <div className="relative mx-auto lg:mx-0">
        <img
          src={avatar}
          alt={name}
          className="w-12 h-12 object-cover rounded-full border border-base-300"
        />
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-base-100" />
        )}
      </div>

      <div className="hidden lg:block text-left min-w-0 flex-1">
        <div className="flex justify-between items-center mb-1">
          <p className="font-medium truncate">{name}</p>
          {conversation.updatedAt && (
            <span className="text-xs text-base-content/60">
              {formatDate(conversation.updatedAt)}
            </span>
          )}
        </div>
        {conversation.lastMessage && (
          <p className="text-sm text-base-content/60 truncate">
            {conversation.lastMessage.text || "📷 Image"}
          </p>
        )}
      </div>
    </button>
  );
};

export default ChatListItem;
