import React from "react";
import { Users, LogOut, Settings, UserPlus } from "lucide-react";
import { useGroupStore } from "../../store/useGroupStore.js";
import { useChatStore } from "../../store/useChatStore.js";

const GroupInfoPanel = ({ onAddMembers }) => {
  const { selectedConversation, setSelectedConversation } = useChatStore();
  const { leaveGroup } = useGroupStore();

  const handleLeaveGroup = async () => {
    if (window.confirm("Are you sure you want to leave this group?")) {
      await leaveGroup(selectedConversation._id || selectedConversation.id);
      setSelectedConversation(null);
    }
  };

  if (!selectedConversation || !selectedConversation.groupName) return null;

  return (
    <div className="w-72 border-l border-base-300 bg-base-100/50 flex flex-col h-full overflow-y-auto p-4 hidden xl:flex">
      <div className="flex flex-col items-center text-center space-y-4 mb-6">
        <div className="w-24 h-24 rounded-full bg-base-300 overflow-hidden border-4 border-base-200">
          <img src={selectedConversation.groupAvatar || "/avatar.png"} alt="Group Avatar" className="w-full h-full object-cover" />
        </div>
        <div>
          <h2 className="text-xl font-bold">{selectedConversation.groupName}</h2>
          <p className="text-sm text-base-content/60">{selectedConversation.participants?.length || 0} participants</p>
        </div>
      </div>

      <div className="space-y-4 flex-1">
        <div className="bg-base-200 rounded-xl p-3">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-base-content/70 flex items-center gap-2">
              <Users className="w-4 h-4" /> Participants
            </h3>
            <button onClick={onAddMembers} className="btn btn-xs btn-ghost btn-circle" title="Add members">
              <UserPlus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {selectedConversation.participants?.map((participant, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-base-300 overflow-hidden">
                  <img src={participant.profilePic || "/avatar.png"} alt="Participant" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{participant.fullName || "User"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <button className="btn btn-outline w-full gap-2">
          <Settings className="w-4 h-4" /> Group Settings
        </button>
        <button onClick={handleLeaveGroup} className="btn btn-outline btn-error w-full gap-2">
          <LogOut className="w-4 h-4" /> Leave Group
        </button>
      </div>
    </div>
  );
};

export default GroupInfoPanel;
