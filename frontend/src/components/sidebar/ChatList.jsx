import React, { useEffect } from "react";
import { useChatStore } from "../../store/useChatStore.js";
import ChatListItem from "./ChatListItem.jsx";
import SidebarSkeleton from "../common/SidebarSkeleton.jsx";

const ChatList = ({ searchQuery }) => {
  const { conversations, getConversations, isConversationsLoading, selectedConversation, setSelectedConversation } = useChatStore();

  useEffect(() => {
    getConversations();
  }, [getConversations]);

  if (isConversationsLoading) return <SidebarSkeleton />;

  const filteredConversations = conversations.filter((c) =>
    (c.fullName || c.groupName || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filteredConversations.length === 0) {
    return (
      <div className="p-4 text-center text-base-content/60 text-sm">
        No conversations found
      </div>
    );
  }

  return (
    <div className="w-full py-2">
      {filteredConversations.map((conversation) => (
        <ChatListItem
          key={conversation._id || conversation.id}
          conversation={conversation}
          isSelected={selectedConversation?._id === conversation._id || selectedConversation?.id === conversation.id}
          onClick={() => setSelectedConversation(conversation)}
        />
      ))}
    </div>
  );
};

export default ChatList;
