import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import { useAuthStore } from "./useAuthStore.js";
import { soundService } from "../lib/sound.js";
import toast from "react-hot-toast";

export const useChatStore = create((set, get) => ({
  messages: [],
  conversations: [],
  users: [],
  selectedConversation: null,
  isUsersLoading: false,
  isConversationsLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to get users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getConversations: async () => {
    set({ isConversationsLoading: true });
    try {
      const res = await axiosInstance.get("/messages/conversations");
      set({ conversations: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to get conversations");
    } finally {
      set({ isConversationsLoading: false });
    }
  },

  getMessages: async (conversationId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${conversationId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to get messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedConversation, messages } = get();
    if (!selectedConversation) return;
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedConversation._id || selectedConversation.id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  setSelectedConversation: (conversation) => {
    set({ selectedConversation: conversation });
    if (conversation) {
      get().getMessages(conversation._id || conversation.id);
    }
  },

  subscribeToMessages: () => {
    const { selectedConversation } = get();
    if (!selectedConversation) return;

    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    const selectedId = selectedConversation._id || selectedConversation.id;

    socket.on("newMessage", (newMessage) => {
      const msgSenderId = typeof newMessage.senderId === "object" 
        ? newMessage.senderId._id 
        : newMessage.senderId;

      // Check if this message is for the currently selected chat
      const isCurrentConversation = 
        // Match by conversationId (works when Conversation object is selected)
        newMessage.conversationId === selectedId ||
        // Match by senderId (works when User object is selected — the sender IS the user)
        msgSenderId === selectedId;
        
      if (isCurrentConversation) {
        set({ messages: [...get().messages, newMessage] });
      }
      soundService.playNotification();
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newMessage");
  },

  updateConversationDetails: (updatedGroup) => {
    const { selectedConversation, conversations } = get();
    const gId = updatedGroup._id || updatedGroup.id;
    
    // Update selectedConversation if currently looking at this group
    if (selectedConversation && (selectedConversation._id === gId || selectedConversation.id === gId)) {
      set({ selectedConversation: { ...selectedConversation, ...updatedGroup } });
    }
    
    // Update or add in conversations list
    const exists = conversations.some(c => (c._id === gId || c.id === gId));
    if (exists) {
      set({
        conversations: conversations.map(c => 
          (c._id === gId || c.id === gId) ? updatedGroup : c
        )
      });
    } else {
      set({ conversations: [updatedGroup, ...conversations] });
    }
  },

  removeConversation: (groupId) => {
    const { selectedConversation, conversations } = get();
    if (selectedConversation && (selectedConversation._id === groupId || selectedConversation.id === groupId)) {
      set({ selectedConversation: null, messages: [] });
    }
    set({
      conversations: conversations.filter(c => c._id !== groupId && c.id !== groupId)
    });
  },
}));
