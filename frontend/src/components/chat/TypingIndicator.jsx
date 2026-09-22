import React from "react";

const TypingIndicator = ({ name }) => {
  return (
    <div className="chat chat-start">
      <div className="chat-bubble bg-base-200 text-base-content text-sm flex items-center gap-2 py-2 px-4 max-w-[fit-content]">
        <span className="opacity-70 text-xs">{name} is typing</span>
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 bg-base-content/50 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
          <span className="w-1.5 h-1.5 bg-base-content/50 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
          <span className="w-1.5 h-1.5 bg-base-content/50 rounded-full animate-bounce"></span>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
