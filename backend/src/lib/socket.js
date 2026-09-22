import { Server } from "socket.io";

let io;
const onlineUsers = new Map(); // userId -> socketId

export const setupSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "http://localhost:5173",
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket) => {
        console.log("A user connected", socket.id);
        const userId = socket.handshake.query.userId;

        if (userId !== "undefined" && userId) {
            onlineUsers.set(userId, socket.id);
        }

        io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));

        // Typing events
        socket.on("typing", ({ conversationId, name }) => {
            socket.broadcast.emit("userTyping", { userId, conversationId, name });
        });

        socket.on("stopTyping", ({ conversationId }) => {
            socket.broadcast.emit("userStoppedTyping", { userId, conversationId });
        });

        // Voice call events (WebRTC signaling)
        socket.on("callUser", ({ userToCall, signalData, from }) => {
            const receiverSocketId = onlineUsers.get(userToCall);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit("incomingCall", { signal: signalData, from });
            }
        });

        socket.on("answerCall", ({ to, signal }) => {
            const callerSocketId = onlineUsers.get(to);
            if (callerSocketId) {
                io.to(callerSocketId).emit("callAccepted", signal);
            }
        });

        socket.on("endCall", ({ to }) => {
            if (to) {
                const receiverSocketId = onlineUsers.get(to);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("callEnded");
                }
            }
        });

        socket.on("disconnect", () => {
            console.log("A user disconnected", socket.id);
            if (userId) {
                onlineUsers.delete(userId);
                io.emit("getOnlineUsers", Array.from(onlineUsers.keys()));
            }
        });
    });

    return io;
};

export const getReceiverSocketId = (userId) => {
    return onlineUsers.get(userId);
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};
