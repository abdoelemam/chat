import React from "react";

const MessageSkeleton = () => {
  const skeletonMessages = Array(6).fill(null);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {skeletonMessages.map((_, idx) => (
        <div key={idx} className={`chat ${idx % 2 === 0 ? "chat-start" : "chat-end"}`}>
          <div className="chat-image avatar">
            <div className="w-10 rounded-full">
              <div className="w-full h-full bg-base-300 rounded-full animate-pulse" />
            </div>
          </div>
          <div className="chat-header mb-1">
            <div className="w-16 h-4 bg-base-300 rounded animate-pulse" />
          </div>
          <div className="chat-bubble bg-base-200 w-32 h-10 animate-pulse" />
        </div>
      ))}
    </div>
  );
};

export default MessageSkeleton;
