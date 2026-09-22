import React, { useState } from "react";
import { Phone, X, Info } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore.js";
import { useChatStore } from "../../store/useChatStore.js";
import { useCallStore } from "../../store/useCallStore.js";
import GroupSettingsModal from "../group/GroupSettingsModal.jsx";

const ChatHeader = () => {
  const { selectedConversation, setSelectedConversation } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore();
  const { callUser } = useCallStore();
  const [showGroupSettings, setShowGroupSettings] = useState(false);

  const isGroup = selectedConversation?.type === "group" || !!selectedConversation?.groupName;

  // Extract the other user's info depending on the data shape
  let otherUser = null;
  let name = "";
  let avatar = "/avatar.png";
  let userId = null; // the actual userId for online check

  if (isGroup) {
    name = selectedConversation.groupName || "Group";
    avatar = selectedConversation.groupAvatar || "/avatar.png";
  } else if (selectedConversation?.fullName) {
    // Selected from Users tab — it's a User object
    otherUser = selectedConversation;
    name = selectedConversation.fullName;
    avatar = selectedConversation.profilePic || "/avatar.png";
    userId = selectedConversation._id || selectedConversation.id;
  } else if (selectedConversation?.participants) {
    // Selected from Chats tab — it's a Conversation object with populated participants
    const other = selectedConversation.participants.find(
      (p) => {
        const pId = typeof p === "object" ? (p._id || p.id) : p;
        const myId = authUser._id || authUser.id;
        return pId?.toString() !== myId?.toString();
      }
    );
    if (other && typeof other === "object") {
      otherUser = other;
      name = other.fullName || "User";
      avatar = other.profilePic || "/avatar.png";
      userId = other._id || other.id;
    } else {
      name = "User";
      userId = other;
    }
  }

  const isOnline = !isGroup && userId && onlineUsers.includes(userId.toString ? userId.toString() : userId);

  const handleCall = () => {
    if (!isGroup && otherUser) {
      callUser(otherUser);
    }
  };

  return (
    <>
      <div className="p-4 border-b border-base-300 flex justify-between items-center bg-base-100/50 backdrop-blur-sm z-10">
        <div
          className={`flex items-center gap-3 ${isGroup ? "cursor-pointer hover:opacity-80 transition" : ""}`}
          onClick={() => isGroup && setShowGroupSettings(true)}
          title={isGroup ? "Click to view group info and change picture" : ""}
        >
          <div className="relative">
            <img
              src={avatar}
              alt={name}
              className="w-10 h-10 object-cover rounded-full border border-base-300"
            />
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-base-100" />
            )}
          </div>
          <div>
            <h3 className="font-semibold truncate max-w-[200px] flex items-center gap-1.5">
              {name}
              {isGroup && <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-base-300 text-base-content/70">Group</span>}
            </h3>
            <p className="text-xs text-base-content/60">
              {isGroup ? `${selectedConversation.participants?.length || 0} members • Click for info` : (isOnline ? "Online" : "Offline")}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isGroup ? (
            <button
              onClick={() => setShowGroupSettings(true)}
              className="btn btn-circle btn-ghost btn-sm"
              title="Group Settings & Photo"
            >
              <Info className="w-5 h-5 text-base-content/70 hover:text-primary transition-colors" />
            </button>
          ) : (
            <button onClick={handleCall} className="btn btn-circle btn-ghost btn-sm" title="Voice Call">
              <Phone className="w-5 h-5 text-base-content/70 hover:text-primary transition-colors" />
            </button>
          )}
          <button
            onClick={() => setSelectedConversation(null)}
            className="btn btn-circle btn-ghost btn-sm"
            title="Close chat"
          >
            <X className="w-5 h-5 text-base-content/70 hover:text-error transition-colors" />
          </button>
        </div>
      </div>

      {isGroup && (
        <GroupSettingsModal
          isOpen={showGroupSettings}
          onClose={() => setShowGroupSettings(false)}
        />
      )}
    </>
  );
};

export default ChatHeader;
