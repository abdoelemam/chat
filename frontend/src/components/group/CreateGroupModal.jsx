import React, { useState, useEffect, useRef } from "react";
import { X, Users, Loader2, Camera, Trash2 } from "lucide-react";
import { useGroupStore } from "../../store/useGroupStore.js";
import { useChatStore } from "../../store/useChatStore.js";
import toast from "react-hot-toast";

const CreateGroupModal = ({ isOpen, onClose }) => {
  const [groupName, setGroupName] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [groupAvatar, setGroupAvatar] = useState(null);
  const fileInputRef = useRef(null);

  const { users, getUsers, getConversations, setSelectedConversation } = useChatStore();
  const { createGroup, isCreating } = useGroupStore();

  useEffect(() => {
    if (isOpen) {
      getUsers();
    }
  }, [isOpen, getUsers]);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return toast.error("Please select an image file");
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setGroupAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    setGroupAvatar(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return toast.error("Group name is required");
    if (selectedParticipants.length < 1) return toast.error("Select at least 1 other participant");

    try {
      const newGroup = await createGroup({
        groupName: groupName.trim(),
        participants: selectedParticipants,
        groupAvatar: groupAvatar || undefined,
      });

      await getConversations();
      if (newGroup) {
        setSelectedConversation(newGroup);
      }

      onClose();
      setGroupName("");
      setSelectedParticipants([]);
      setGroupAvatar(null);
    } catch (error) {
      console.error(error);
    }
  };

  const toggleParticipant = (userId) => {
    setSelectedParticipants((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-base-100 rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col m-4 shadow-2xl border border-base-300">
        <div className="p-4 border-b border-base-300 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-lg">Create New Group</h2>
          </div>
          <button onClick={onClose} className="btn btn-circle btn-sm btn-ghost">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex-1 overflow-y-auto flex flex-col gap-4">
          {/* Group Avatar Upload */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full bg-base-200 border-2 border-primary/30 flex items-center justify-center overflow-hidden">
                {groupAvatar ? (
                  <img src={groupAvatar} alt="Group Preview" className="w-full h-full object-cover" />
                ) : (
                  <Users className="w-8 h-8 text-base-content/40" />
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-content hover:scale-105 transition shadow-lg"
                title="Choose Group Picture"
              >
                <Camera className="w-4 h-4" />
              </button>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </div>

            {groupAvatar && (
              <button
                type="button"
                onClick={removeAvatar}
                className="text-xs text-error flex items-center gap-1 hover:underline"
              >
                <Trash2 className="w-3 h-3" /> Remove picture
              </button>
            )}
            <span className="text-xs text-base-content/60">Optional Group Picture</span>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Group Name</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="e.g. Friends, Project Team..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-control flex-1 overflow-hidden flex flex-col">
            <label className="label justify-between">
              <span className="label-text font-medium">Select Participants</span>
              <span className="badge badge-primary badge-sm">{selectedParticipants.length} selected</span>
            </label>
            <div className="bg-base-200/50 border border-base-300 rounded-xl p-2 overflow-y-auto max-h-48 space-y-1">
              {users.length === 0 ? (
                <div className="text-center py-6 text-base-content/60 text-sm">
                  No other users found
                </div>
              ) : (
                users.map((user) => {
                  const uId = user._id || user.id;
                  const isChecked = selectedParticipants.includes(uId);
                  return (
                    <label
                      key={uId}
                      className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                        isChecked ? "bg-primary/10 border border-primary/30" : "hover:bg-base-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary checkbox-sm"
                        checked={isChecked}
                        onChange={() => toggleParticipant(uId)}
                      />
                      <div className="avatar">
                        <div className="w-9 h-9 rounded-full">
                          <img src={user.profilePic || "/avatar.png"} alt={user.fullName} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium block truncate">{user.fullName}</span>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>
          
          <button
            type="submit"
            className="btn btn-primary w-full mt-2"
            disabled={isCreating || !groupName.trim() || selectedParticipants.length < 1}
          >
            {isCreating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Creating Group...
              </>
            ) : (
              "Create Group"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
