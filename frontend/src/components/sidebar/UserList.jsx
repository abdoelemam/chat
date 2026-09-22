import React, { useEffect } from "react";
import { useChatStore } from "../../store/useChatStore.js";
import ChatListItem from "./ChatListItem.jsx";
import SidebarSkeleton from "../common/SidebarSkeleton.jsx";

const UserList = ({ searchQuery }) => {
  const { users, getUsers, isUsersLoading, selectedConversation, setSelectedConversation } = useChatStore();

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  if (isUsersLoading) return <SidebarSkeleton />;

  const filteredUsers = users.filter((u) =>
    (u.fullName || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filteredUsers.length === 0) {
    return (
      <div className="p-4 text-center text-base-content/60 text-sm">
        No users found
      </div>
    );
  }

  return (
    <div className="w-full py-2">
      {filteredUsers.map((user) => (
        <ChatListItem
          key={user._id || user.id}
          conversation={user}
          isSelected={selectedConversation?._id === user._id || selectedConversation?.id === user.id}
          onClick={() => setSelectedConversation(user)}
        />
      ))}
    </div>
  );
};

export default UserList;
