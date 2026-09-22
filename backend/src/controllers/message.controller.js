import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, getIO } from "../lib/socket.js";
import mongoose from "mongoose";

export const getUsers = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
        res.status(200).json(filteredUsers);
    } catch (error) {
        console.error("Error in getUsers:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getConversations = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const conversations = await Conversation.find({ participants: loggedInUserId })
            .populate("participants", "-password")
            .populate("lastMessage")
            .sort({ updatedAt: -1 });
        res.status(200).json(conversations);
    } catch (error) {
        console.error("Error in getConversations:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const loggedInUserId = req.user._id;

        // First try to find by conversation ID directly
        let conversation = await Conversation.findById(conversationId);

        // If not found, treat conversationId as a userId and find their direct conversation
        if (!conversation) {
            conversation = await Conversation.findOne({
                type: "direct",
                participants: { $all: [loggedInUserId, conversationId] }
            });
        }

        if (!conversation) {
            // No conversation exists yet — return empty array
            return res.status(200).json([]);
        }

        const messages = await Message.find({ conversationId: conversation._id })
            .populate("senderId", "fullName profilePic");
        res.status(200).json(messages);
    } catch (error) {
        console.error("Error in getMessages:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        let { conversationId } = req.params;
        const senderId = req.user._id;

        let conversation;

        // If conversationId is actually a user ID, find or create direct conversation
        if (mongoose.Types.ObjectId.isValid(conversationId)) {
            conversation = await Conversation.findById(conversationId);
            if (!conversation) {
                // Treat conversationId as a target user ID for a direct chat
                const targetUserId = conversationId;
                conversation = await Conversation.findOne({
                    type: "direct",
                    participants: { $all: [senderId, targetUserId] }
                });

                if (!conversation) {
                    conversation = await Conversation.create({
                        type: "direct",
                        participants: [senderId, targetUserId]
                    });
                }
                conversationId = conversation._id;
            }
        }

        if (conversation && conversation.type === "group") {
            const isMember = conversation.participants.some(p => p.toString() === senderId.toString());
            if (!isMember) {
                return res.status(403).json({ message: "You are no longer a member of this group" });
            }
        }

        let imageUrl;
        if (image) {
            try {
                const uploadResponse = await cloudinary.uploader.upload(image, {
                    resource_type: "auto",
                    folder: "chatweb",
                });
                imageUrl = uploadResponse.secure_url;
            } catch (uploadError) {
                console.error("Cloudinary upload error:", uploadError.message);
                return res.status(400).json({ message: "Image upload failed: " + uploadError.message });
            }
        }

        const newMessage = new Message({
            conversationId,
            senderId,
            text,
            image: imageUrl,
        });

        await newMessage.save();

        conversation.lastMessage = newMessage._id;
        await conversation.save();

        const populatedMessage = await Message.findById(newMessage._id).populate("senderId", "fullName profilePic");

        const io = getIO();

        if (conversation.type === "direct") {
            const receiverId = conversation.participants.find(p => p.toString() !== senderId.toString());
            const receiverSocketId = getReceiverSocketId(receiverId.toString());
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("newMessage", populatedMessage);
            }
        } else if (conversation.type === "group") {
            conversation.participants.forEach(participantId => {
                if (participantId.toString() !== senderId.toString()) {
                    const socketId = getReceiverSocketId(participantId.toString());
                    if (socketId) {
                        io.to(socketId).emit("newMessage", populatedMessage);
                    }
                }
            });
        }

        res.status(201).json(populatedMessage);
    } catch (error) {
        console.error("Error in sendMessage:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};
