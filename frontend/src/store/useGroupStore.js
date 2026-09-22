import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import { useChatStore } from "./useChatStore.js";
import toast from "react-hot-toast";

export const useGroupStore = create((set) => ({
  isCreating: false,
  isUpdating: false,

  createGroup: async (data) => {
    set({ isCreating: true });
    try {
      const res = await axiosInstance.post("/groups/create", data);
      toast.success("Group created successfully");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create group");
      throw error;
    } finally {
      set({ isCreating: false });
    }
  },

  addMembers: async (groupId, members) => {
    try {
      const res = await axiosInstance.put(`/groups/${groupId}/add-members`, { newParticipants: members });
      toast.success("Members added successfully");
      const chatStore = useChatStore.getState();
      chatStore.setSelectedConversation(res.data);
      chatStore.getConversations();
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add members");
      throw error;
    }
  },

  removeMember: async (groupId, memberId) => {
    try {
      const res = await axiosInstance.put(`/groups/${groupId}/remove-member`, { memberId });
      toast.success("Member removed successfully");
      const chatStore = useChatStore.getState();
      chatStore.setSelectedConversation(res.data);
      chatStore.getConversations();
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove member");
      throw error;
    }
  },

  updateGroup: async (groupId, data) => {
    set({ isUpdating: true });
    try {
      const res = await axiosInstance.put(`/groups/${groupId}/update`, data);
      toast.success("Group updated successfully");
      const chatStore = useChatStore.getState();
      chatStore.setSelectedConversation(res.data);
      chatStore.getConversations();
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update group");
      throw error;
    } finally {
      set({ isUpdating: false });
    }
  },

  leaveGroup: async (groupId) => {
    try {
      await axiosInstance.delete(`/groups/${groupId}/leave`);
      toast.success("Left group successfully");
      const chatStore = useChatStore.getState();
      chatStore.setSelectedConversation(null);
      chatStore.getConversations();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to leave group");
      throw error;
    }
  },
}));
