import React, { useState, useRef } from "react";
import { X, Camera, Users, UserPlus, LogOut, Loader2, Check, Edit2 } from "lucide-react";
import { useGroupStore } from "../../store/useGroupStore.js";
import { useChatStore } from "../../store/useChatStore.js";
import { useAuthStore } from "../../store/useAuthStore.js";
import AddMembersModal from "./AddMembersModal.jsx";
import toast from "react-hot-toast";

const GroupSettingsModal = ({ isOpen, onClose }) => {
  const { selectedConversation, setSelectedConversation } = useChatStore();
  const { authUser } = useAuthStore();
  const { updateGroup, leaveGroup, isUpdating } = useGroupStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [showAddMembers, setShowAddMembers] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen || !selectedConversation) return null;

  const isGroup = selectedConversation?.type === "group" || !!selectedConversation?.groupName;
  if (!isGroup) return null;

  const currentName = selectedConversation.groupName || "Group";
  const currentAvatar = selectedConversation.groupAvatar || "/avatar.png";
  const participants = selectedConversation.participants || [];
  const adminId = selectedConversation.groupAdmin?._id || selectedConversation.groupAdmin;
  const currentUserId = authUser?._id || authUser?.id;

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return toast.error("Please choose an image file");
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        await updateGroup(selectedConversation._id || selectedConversation.id, {
          groupAvatar: reader.result,
        });
      } catch (err) {
        console.error("Failed to update group picture:", err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveName = async () => {
    if (!newGroupName.trim()) return;
    try {
      await updateGroup(selectedConversation._id || selectedConversation.id, {
        groupName: newGroupName.trim(),
      });
      setIsEditingName(false);
    } catch (err) {
      console.error("Failed to update group name:", err);
    }
  };

  const handleLeaveGroup = async () => {
    if (window.confirm("Are you sure you want to leave this group?")) {
      await leaveGroup(selectedConversation._id || selectedConversation.id);
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-base-100 rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col m-4 shadow-2xl border border-base-300">
          {/* Header */}
          <div className="p-4 border-b border-base-300 flex justify-between items-center">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Group Info & Settings
            </h2>
            <button onClick={onClose} className="btn btn-circle btn-sm btn-ghost">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 flex-1 overflow-y-auto space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-base-200 border-4 border-primary/30 overflow-hidden shadow-inner flex items-center justify-center">
                  <img
                    src={currentAvatar}
                    alt={currentName}
                    className="w-full h-full object-cover"
                  />
                  {isUpdating && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-white" />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUpdating}
                  className="absolute bottom-0 right-0 p-2.5 rounded-full bg-primary text-primary-content hover:scale-105 transition shadow-lg"
                  title="Change group photo"
                >
                  <Camera className="w-4 h-4" />
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              <span className="text-xs text-base-content/60">Click camera to change group photo</span>
            </div>

            {/* Group Name Section */}
            <div className="bg-base-200/50 rounded-xl p-4 border border-base-300">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-base-content/60">Group Name</span>
                {!isEditingName && (
                  <button
                    onClick={() => {
                      setNewGroupName(currentName);
                      setIsEditingName(true);
                    }}
                    className="text-xs text-primary flex items-center gap-1 hover:underline"
                  >
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                )}
              </div>

              {isEditingName ? (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="text"
                    className="input input-bordered input-sm flex-1"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={isUpdating || !newGroupName.trim()}
                    className="btn btn-primary btn-sm btn-circle"
                    title="Save"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsEditingName(false)}
                    className="btn btn-ghost btn-sm btn-circle"
                    title="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <p className="text-lg font-bold text-base-content">{currentName}</p>
              )}
            </div>

            {/* Participants Section */}
            <div className="bg-base-200/50 rounded-xl p-4 border border-base-300">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" /> Members ({participants.length})
                </h3>
                <button
                  onClick={() => setShowAddMembers(true)}
                  className="btn btn-xs btn-primary gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Add Member
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {participants.map((p, idx) => {
                  const pId = typeof p === "object" ? (p._id || p.id) : p;
                  const pName = typeof p === "object" ? p.fullName : "User";
                  const pAvatar = typeof p === "object" ? (p.profilePic || "/avatar.png") : "/avatar.png";
                  const isMe = pId?.toString() === currentUserId?.toString();
                  const isAdmin = pId?.toString() === adminId?.toString();

                  return (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-base-200">
                      <div className="flex items-center gap-3">
                        <div className="avatar">
                          <div className="w-8 h-8 rounded-full border border-base-300">
                            <img src={pAvatar} alt={pName} />
                          </div>
                        </div>
                        <span className="text-sm font-medium">
                          {pName} {isMe && <span className="text-xs text-base-content/60">(You)</span>}
                        </span>
                      </div>

                      {isAdmin && (
                        <span className="badge badge-sm badge-outline badge-primary">Admin</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Leave Group Button */}
            <button
              onClick={handleLeaveGroup}
              className="btn btn-outline btn-error w-full gap-2"
            >
              <LogOut className="w-4 h-4" /> Leave Group
            </button>
          </div>
        </div>
      </div>

      <AddMembersModal
        isOpen={showAddMembers}
        onClose={() => setShowAddMembers(false)}
      />
    </>
  );
};

export default GroupSettingsModal;
