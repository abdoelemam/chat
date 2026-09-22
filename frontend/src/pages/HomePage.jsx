import React from "react";
import Sidebar from "../components/sidebar/Sidebar.jsx";
import ChatContainer from "../components/chat/ChatContainer.jsx";
import NoChatSelected from "../components/common/NoChatSelected.jsx";
import { useChatStore } from "../store/useChatStore.js";

const HomePage = () => {
  const { selectedConversation } = useChatStore();

  return (
    <div className="h-full bg-base-200">
      <div className="flex items-center justify-center h-full pt-16 px-4">
        <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-6rem)] overflow-hidden">
          <div className="flex h-full">
            <Sidebar />
            {!selectedConversation ? <NoChatSelected /> : <ChatContainer />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
