import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, getIO } from "../lib/socket.js";

const broadcastSystemMessage = async (groupId, text, senderId, participantIds) => {
    try {
        const systemMessage = new Message({
            conversationId: groupId,
            senderId,
            text,
            isSystem: true,
        });
        await systemMessage.save();

        await Conversation.findByIdAndUpdate(groupId, { lastMessage: systemMessage._id });

        const populatedMessage = await Message.findById(systemMessage._id).populate("senderId", "fullName profilePic");

        const io = getIO();
        participantIds.forEach((pId) => {
            const socketId = getReceiverSocketId(pId.toString());
            if (socketId) {
                io.to(socketId).emit("newMessage", populatedMessage);
            }
        });

        return populatedMessage;
    } catch (err) {
        console.error("Error broadcasting system message:", err.message);
    }
};

const emitGroupUpdate = (participantIds, updatedGroup) => {
    try {
        const io = getIO();
        participantIds.forEach((pId) => {
            const socketId = getReceiverSocketId(pId.toString());
            if (socketId) {
                io.to(socketId).emit("groupUpdated", updatedGroup);
            }
        });
    } catch (err) {
        console.error("Error emitting groupUpdated:", err.message);
    }
};

export const createGroup = async (req, res) => {
    try {
        const { groupName, participants, groupAvatar } = req.body;
        const adminId = req.user._id;

        if (!groupName || !participants || participants.length < 1) {
            return res.status(400).json({ message: "Group name and at least 1 other participant are required" });
        }

        const allParticipants = [...new Set([...participants, adminId.toString()])];

        let avatarUrl = "";
        if (groupAvatar) {
            try {
                const uploadResponse = await cloudinary.uploader.upload(groupAvatar, {
                    folder: "chatweb_groups",
                });
                avatarUrl = uploadResponse.secure_url;
            } catch (uploadError) {
                console.error("Error uploading group avatar in createGroup:", uploadError.message);
            }
        }

        const newGroup = new Conversation({
            type: "group",
            groupName,
            groupAvatar: avatarUrl || undefined,
            groupAdmin: adminId,
            participants: allParticipants,
        });

        await newGroup.save();

        // Broadcast initial creation message
        await broadcastSystemMessage(
            newGroup._id,
            `${req.user.fullName} created group "${groupName}"`,
            adminId,
            allParticipants
        );

        const populatedGroup = await Conversation.findById(newGroup._id)
            .populate("participants", "-password")
            .populate("lastMessage");

        // Real-time broadcast to all participants so group shows in their chats list
        emitGroupUpdate(allParticipants, populatedGroup);

        res.status(201).json(populatedGroup);
    } catch (error) {
        console.error("Error in createGroup:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const addMembers = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { newParticipants } = req.body;
        const adminId = req.user._id;

        const group = await Conversation.findById(groupId);
        
        if (!group || group.type !== "group") {
            return res.status(404).json({ message: "Group not found" });
        }

        if (group.groupAdmin.toString() !== adminId.toString()) {
            return res.status(403).json({ message: "Only admin can add members" });
        }

        // Fetch added users' names for the system message
        const addedUsers = await User.find({ _id: { $in: newParticipants } }).select("fullName");
        const addedNames = addedUsers.map(u => u.fullName).join(", ");

        group.participants.push(...newParticipants);
        group.participants = [...new Set(group.participants.map(id => id.toString()))];
        
        await group.save();

        // Broadcast system message
        await broadcastSystemMessage(
            group._id,
            `${req.user.fullName} added ${addedNames || "new members"} to the group`,
            adminId,
            group.participants
        );

        const populated = await Conversation.findById(group._id)
            .populate("participants", "-password")
            .populate("lastMessage");

        // Broadcast updated group to all members
        emitGroupUpdate(group.participants, populated);

        res.status(200).json(populated);
    } catch (error) {
        console.error("Error in addMembers:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const removeMember = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { memberId } = req.body;
        const adminId = req.user._id;

        const group = await Conversation.findById(groupId);

        if (!group || group.type !== "group") {
            return res.status(404).json({ message: "Group not found" });
        }

        if (group.groupAdmin.toString() !== adminId.toString()) {
            return res.status(403).json({ message: "Only admin can remove members" });
        }

        if (adminId.toString() === memberId.toString()) {
            return res.status(400).json({ message: "Admin cannot remove themselves" });
        }

        const removedUser = await User.findById(memberId).select("fullName");
        const notifyList = [...group.participants];

        group.participants = group.participants.filter(id => id.toString() !== memberId.toString());
        await group.save();

        // Broadcast to remaining members and removed member
        await broadcastSystemMessage(
            group._id,
            `${req.user.fullName} removed ${removedUser?.fullName || "a member"} from the group`,
            adminId,
            notifyList
        );

        const populated = await Conversation.findById(group._id)
            .populate("participants", "-password")
            .populate("lastMessage");

        // Broadcast to remaining participants
        emitGroupUpdate(group.participants, populated);

        // Notify removed member that they left
        const removedSocketId = getReceiverSocketId(memberId.toString());
        if (removedSocketId) {
            getIO().to(removedSocketId).emit("leftGroup", { groupId: group._id });
        }

        res.status(200).json(populated);
    } catch (error) {
        console.error("Error in removeMember:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updateGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { groupName, groupAvatar } = req.body;
        const adminId = req.user._id;

        const group = await Conversation.findById(groupId);

        if (!group || group.type !== "group") {
            return res.status(404).json({ message: "Group not found" });
        }

        const isAdmin = !group.groupAdmin || group.groupAdmin.toString() === adminId.toString();
        const isParticipant = group.participants.some(p => p.toString() === adminId.toString());
        if (!isAdmin && !isParticipant) {
            return res.status(403).json({ message: "Only group members can update group details" });
        }

        let changeText = "";
        if (groupName && groupName.trim() && groupName.trim() !== group.groupName) {
            changeText = `${req.user.fullName} changed group name to "${groupName.trim()}"`;
            group.groupName = groupName.trim();
        }

        if (groupAvatar) {
            try {
                const uploadResponse = await cloudinary.uploader.upload(groupAvatar, {
                    folder: "chatweb_groups",
                });
                group.groupAvatar = uploadResponse.secure_url;
                changeText = `${req.user.fullName} updated the group photo`;
            } catch (uploadError) {
                console.error("Cloudinary group avatar upload error:", uploadError.message);
                return res.status(400).json({ message: "Failed to upload group avatar: " + uploadError.message });
            }
        }

        await group.save();

        if (changeText) {
            await broadcastSystemMessage(group._id, changeText, adminId, group.participants);
        }

        const populated = await Conversation.findById(group._id)
            .populate("participants", "-password")
            .populate("lastMessage");

        // Broadcast to all participants in real-time
        emitGroupUpdate(group.participants, populated);

        res.status(200).json(populated);
    } catch (error) {
        console.error("Error in updateGroup:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const leaveGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user._id;

        const group = await Conversation.findById(groupId);

        if (!group || group.type !== "group") {
            return res.status(404).json({ message: "Group not found" });
        }

        const notifyList = [...group.participants];

        group.participants = group.participants.filter(id => id.toString() !== userId.toString());

        if (group.participants.length === 0) {
            await Conversation.findByIdAndDelete(groupId);
            // Notify user
            const userSocketId = getReceiverSocketId(userId.toString());
            if (userSocketId) {
                getIO().to(userSocketId).emit("leftGroup", { groupId });
            }
            return res.status(200).json({ message: "Group deleted as last member left" });
        }

        if (group.groupAdmin && group.groupAdmin.toString() === userId.toString()) {
            group.groupAdmin = group.participants[0];
        }

        await group.save();

        // Broadcast to remaining participants that user left
        await broadcastSystemMessage(
            group._id,
            `${req.user.fullName} left the group`,
            userId,
            notifyList
        );

        const populated = await Conversation.findById(group._id)
            .populate("participants", "-password")
            .populate("lastMessage");

        // Broadcast updated group to all remaining participants so their UI immediately removes the user
        emitGroupUpdate(group.participants, populated);

        // Notify the leaving user so their UI removes the group from their chats
        const userSocketId = getReceiverSocketId(userId.toString());
        if (userSocketId) {
            getIO().to(userSocketId).emit("leftGroup", { groupId: group._id });
        }

        res.status(200).json({ message: "Left group successfully", group: populated });
    } catch (error) {
        console.error("Error in leaveGroup:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};
