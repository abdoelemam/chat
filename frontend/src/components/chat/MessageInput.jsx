import React, { useState, useRef } from "react";
import { ImagePlus, Send, X } from "lucide-react";
import { useChatStore } from "../../store/useChatStore.js";
import { useAuthStore } from "../../store/useAuthStore.js";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const { sendMessage, selectedConversation } = useChatStore();
  const { socket, authUser } = useAuthStore();
  const typingTimeoutRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleTyping = (e) => {
    setText(e.target.value);

    if (socket && selectedConversation) {
      socket.emit("typing", {
        conversationId: selectedConversation._id || selectedConversation.id,
        name: authUser.fullName,
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stopTyping", {
          conversationId: selectedConversation._id || selectedConversation.id,
        });
      }, 2000);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    await sendMessage({
      text: text.trim(),
      image: imagePreview,
    });

    setText("");
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (socket && selectedConversation) {
      socket.emit("stopTyping", {
        conversationId: selectedConversation._id || selectedConversation.id,
      });
    }
  };

  return (
    <div className="p-4 bg-base-100 border-t border-base-300">
      {imagePreview && (
        <div className="mb-4 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-base-300"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-base-300 flex items-center justify-center hover:bg-error hover:text-white transition-colors"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSend} className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            className="input input-bordered w-full rounded-full pl-4 pr-12 bg-base-200 focus:outline-none"
            placeholder="Type a message..."
            value={text}
            onChange={handleTyping}
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-circle btn-sm btn-ghost text-base-content/60 hover:text-primary"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="w-5 h-5" />
          </button>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />
        </div>
        <button
          type="submit"
          className="btn btn-circle btn-primary"
          disabled={!text.trim() && !imagePreview}
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
