import React, { useEffect, useRef, useState } from "react";
import { useChatStore } from "../../store/useChatStore.js";
import { useAuthStore } from "../../store/useAuthStore.js";
import ChatHeader from "./ChatHeader.jsx";
import MessageInput from "./MessageInput.jsx";
import MessageBubble from "./MessageBubble.jsx";
import MessageSkeleton from "../common/MessageSkeleton.jsx";
import DateSeparator from "./DateSeparator.jsx";
import TypingIndicator from "./TypingIndicator.jsx";
import { formatDate } from "../../lib/utils.js";

const ChatContainer = () => {
  const {
    messages,
    isMessagesLoading,
    selectedConversation,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();
  const { authUser, socket } = useAuthStore();
  const messagesEndRef = useRef(null);
  const [typingUsers, setTypingUsers] = useState([]);

  useEffect(() => {
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [selectedConversation, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (socket) {
      socket.on("userTyping", ({ userId, conversationId, name }) => {
        if (
          conversationId === (selectedConversation._id || selectedConversation.id) ||
          userId === (selectedConversation._id || selectedConversation.id)
        ) {
          setTypingUsers((prev) => {
            if (!prev.find((u) => u.userId === userId)) {
              return [...prev, { userId, name }];
            }
            return prev;
          });
        }
      });

      socket.on("userStoppedTyping", ({ userId }) => {
        setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
      });

      return () => {
        socket.off("userTyping");
        socket.off("userStoppedTyping");
      };
    }
  }, [socket, selectedConversation]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typingUsers]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  let lastDate = null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-base-100">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const messageDate = formatDate(message.createdAt);
          const showDateSeparator = lastDate !== messageDate;
          lastDate = messageDate;

          const senderId = typeof message.senderId === "object" ? message.senderId._id : message.senderId;
          const isSentByMe = senderId === authUser._id || senderId === authUser.id;

          return (
            <React.Fragment key={message._id || message.id}>
              {showDateSeparator && <DateSeparator date={messageDate} />}
              <MessageBubble message={message} isSentByMe={isSentByMe} />
            </React.Fragment>
          );
        })}

        {typingUsers.map((u) => (
          <TypingIndicator key={u.userId} name={u.name} />
        ))}
        
        <div ref={messagesEndRef} />
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;
