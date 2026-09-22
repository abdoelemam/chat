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
            const targetId = userToCall?.toString();
            console.log(`[Call] ${from?.fullName || from?._id} calling ${targetId}`);
            const receiverSocketId = onlineUsers.get(targetId);
            if (receiverSocketId) {
                console.log(`[Call] Forwarding call to socket: ${receiverSocketId}`);
                io.to(receiverSocketId).emit("incomingCall", { signal: signalData, from });
            } else {
                console.log(`[Call] User ${targetId} is NOT online. Online users:`, Array.from(onlineUsers.keys()));
                // Notify caller that user is offline
                socket.emit("callEnded");
            }
        });

        socket.on("answerCall", ({ to, signal }) => {
            const targetId = to?.toString();
            console.log(`[Call] Answer from ${userId} to ${targetId}`);
            const callerSocketId = onlineUsers.get(targetId);
            if (callerSocketId) {
                io.to(callerSocketId).emit("callAccepted", signal);
            }
        });

        socket.on("iceCandidate", ({ to, candidate }) => {
            const targetId = to?.toString();
            if (targetId && candidate) {
                const receiverSocketId = onlineUsers.get(targetId);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit("iceCandidate", { candidate });
                }
            }
        });

        socket.on("endCall", ({ to }) => {
            const targetId = to?.toString();
            console.log(`[Call] End call from ${userId} to ${targetId}`);
            if (targetId) {
                const receiverSocketId = onlineUsers.get(targetId);
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
