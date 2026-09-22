import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { useGroupStore } from "../../store/useGroupStore.js";
import { useChatStore } from "../../store/useChatStore.js";
import toast from "react-hot-toast";

const AddMembersModal = ({ isOpen, onClose }) => {
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { users, getUsers, selectedConversation } = useChatStore();
  const { addMembers } = useGroupStore();

  useEffect(() => {
    if (isOpen) {
      getUsers();
    }
  }, [isOpen, getUsers]);

  if (!isOpen || !selectedConversation) return null;

  const currentParticipantIds = selectedConversation.participants?.map(p => p._id || p.id) || [];
  const availableUsers = users.filter(u => !currentParticipantIds.includes(u._id || u.id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedParticipants.length === 0) return toast.error("Select at least 1 participant");

    try {
      setIsLoading(true);
      await addMembers(selectedConversation._id || selectedConversation.id, selectedParticipants);
      onClose();
      setSelectedParticipants([]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleParticipant = (userId) => {
    setSelectedParticipants((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-base-100 rounded-xl w-full max-w-md max-h-[90vh] flex flex-col m-4 shadow-xl">
        <div className="p-4 border-b border-base-300 flex justify-between items-center">
          <h2 className="font-bold text-lg">Add Members</h2>
          <button onClick={onClose} className="btn btn-circle btn-sm btn-ghost">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 flex-1 overflow-y-auto flex flex-col gap-4">
          <div className="form-control flex-1 overflow-hidden flex flex-col">
            <label className="label">
              <span className="label-text font-medium">Select Participants ({selectedParticipants.length})</span>
            </label>
            <div className="bg-base-200 rounded-lg p-2 overflow-y-auto max-h-64 space-y-2">
              {availableUsers.length === 0 ? (
                <div className="text-center text-sm text-base-content/60 py-4">No other users available</div>
              ) : (
                availableUsers.map((user) => (
                  <label key={user._id || user.id} className="flex items-center gap-3 p-2 hover:bg-base-300 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary checkbox-sm"
                      checked={selectedParticipants.includes(user._id || user.id)}
                      onChange={() => toggleParticipant(user._id || user.id)}
                    />
                    <div className="avatar">
                      <div className="w-8 rounded-full">
                        <img src={user.profilePic || "/avatar.png"} alt={user.fullName} />
                      </div>
                    </div>
                    <span className="text-sm font-medium">{user.fullName}</span>
                  </label>
                ))
              )}
            </div>
          </div>
          
          <button type="submit" className="btn btn-primary w-full mt-2" disabled={isLoading || selectedParticipants.length === 0}>
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Add to Group"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddMembersModal;
