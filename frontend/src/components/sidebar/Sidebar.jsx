import React, { useState } from "react";
import { Users, MessageSquare, UserPlus } from "lucide-react";
import SearchBar from "./SearchBar.jsx";
import ChatList from "./ChatList.jsx";
import UserList from "./UserList.jsx";
import CreateGroupModal from "../group/CreateGroupModal.jsx";
import { useAuthStore } from "../../store/useAuthStore.js";

const Sidebar = () => {
  const [activeTab, setActiveTab] = useState("chats");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const { onlineUsers } = useAuthStore();

  return (
    <>
      <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col bg-base-100/50">
        <div className="p-4 border-b border-base-300">
          <div className="flex items-center justify-between mb-4 hidden lg:flex">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-primary" />
              <span className="font-bold text-lg">Messages</span>
            </div>
            <button
              onClick={() => setShowCreateGroup(true)}
              className="btn btn-circle btn-sm btn-ghost"
              title="Create Group"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="hidden lg:block mb-4">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>

          <div className="flex justify-center lg:justify-start gap-2">
            <button
              onClick={() => setActiveTab("chats")}
              className={`btn btn-sm flex-1 ${activeTab === "chats" ? "btn-primary" : "btn-ghost"}`}
            >
              <MessageSquare className="w-4 h-4 lg:mr-2" />
              <span className="hidden lg:inline">Chats</span>
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`btn btn-sm flex-1 ${activeTab === "users" ? "btn-primary" : "btn-ghost"}`}
            >
              <Users className="w-4 h-4 lg:mr-2" />
              <span className="hidden lg:inline">Users</span>
            </button>
          </div>
          
          {activeTab === "users" && (
            <div className="mt-4 hidden lg:flex items-center gap-2">
              <span className="text-xs text-base-content/60">Online ({Math.max(0, onlineUsers.length - 1)})</span>
            </div>
          )}
        </div>

        {/* Mobile create group button */}
        <div className="lg:hidden flex justify-center py-2 border-b border-base-300">
          <button
            onClick={() => setShowCreateGroup(true)}
            className="btn btn-circle btn-sm btn-ghost"
            title="Create Group"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === "chats" ? (
            <ChatList searchQuery={searchQuery} />
          ) : (
            <UserList searchQuery={searchQuery} />
          )}
        </div>
      </aside>

      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
      />
    </>
  );
};

export default Sidebar;
