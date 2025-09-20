const { Server } = require("socket.io");
const Radiologist = require("../models/Radiologists.Model");
const Notification = require("../models/not.model");
const CenterRadiologistsRelation = require("../models/CenterRadiologistsRelation.Model");
const RadiologyCenter = require("../models/Radiology_Centers.Model");

class NotificationManager {
    constructor() {
        this.activeUsers = new Map();
        this.io = null;
        this.isInitialized = false; 
    }

    initialize(httpServer) {
        if (this.isInitialized) {
            console.warn('Socket.io is already initialized');
            return this.io;
        }

        this.io = new Server(httpServer, {
            cors: {
                origin: [
                    "http://localhost:8000",
                    "https://graduation-project--xohomg.fly.dev",
                    "http://127.0.0.1:5500",
                    "http://127.0.0.1:5500/te5.html",
                    "https://dicom-file-git-main-ahmed0rasheds-projects.vercel.app/"
                    
                ],
                methods: ["GET", "POST"],
                credentials: true
            },
            pingTimeout: 60000,
            pingInterval: 25000
        });

        this._setupConnectionHandlers();
        this.isInitialized = true;
        console.log("Socket.io initialized successfully");
        return this.io;
    }

    _setupConnectionHandlers() {
        this.io.on("connection", (socket) => {
            console.log(` New connection: ${socket.id}`);

            socket.on("userOnline", async ({ userId, userType }) => {
                try {
                    await Radiologist.findByIdAndUpdate(userId, { 
                        status: "online",
                        lastSeen: new Date()
                    });

                    this.activeUsers.set(userId.toString(), {
                        socketId: socket.id,
                        userType,
                        lastActive: new Date()
                    });

                    console.log(`${userType} ${userId} connected`);
                    
                    const notifications = await this.getUnreadNotifications(userId);
                    
                    socket.emit("initialNotifications", notifications);

                    // Join user to their personal room for direct messaging
                    socket.join(`user_${userId}`);
                    
                } catch (error) {
                    console.error("Connection error:", error);
                    socket.emit("connectionError", { error: "Failed to establish connection" });
                }
            });

            // Chat-specific events
            socket.on("joinChat", ({ userId, userType, partnerId, partnerType }) => {
                try {
                    // Join a room for this specific conversation
                    const roomId = this.getConversationRoomId(userId, userType, partnerId, partnerType);
                    socket.join(roomId);
                    console.log(`User ${userId} joined chat room: ${roomId}`);
                } catch (error) {
                    console.error("Join chat error:", error);
                    socket.emit("chatError", { error: "Failed to join chat" });
                }
            });

            socket.on("leaveChat", ({ userId, userType, partnerId, partnerType }) => {
                try {
                    const roomId = this.getConversationRoomId(userId, userType, partnerId, partnerType);
                    socket.leave(roomId);
                    console.log(`User ${userId} left chat room: ${roomId}`);
                } catch (error) {
                    console.error("Leave chat error:", error);
                }
            });

            socket.on("typing", ({ userId, userType, partnerId, partnerType, isTyping }) => {
                try {
                    const roomId = this.getConversationRoomId(userId, userType, partnerId, partnerType);
                    socket.to(roomId).emit("userTyping", {
                        userId,
                        userType,
                        isTyping
                    });
                } catch (error) {
                    console.error("Typing indicator error:", error);
                }
            });

            // Message delivery confirmation
            socket.on("messageDelivered", ({ messageId, userId, userType }) => {
                try {
                    console.log(`Message ${messageId} delivered to ${userType} ${userId}`);
                    // You can add database update here if needed
                } catch (error) {
                    console.error("Message delivery confirmation error:", error);
                }
            });

            // User status updates
            socket.on("updateStatus", async ({ userId, userType, status }) => {
                try {
                    if (userType === 'Radiologist') {
                        await Radiologist.findByIdAndUpdate(userId, { 
                            status: status,
                            lastSeen: new Date()
                        });
                    }
                    
                    // Broadcast status update to all connected users
                    socket.broadcast.emit("userStatusUpdate", {
                        userId,
                        userType,
                        status,
                        lastSeen: new Date()
                    });
                } catch (error) {
                    console.error("Status update error:", error);
                }
            });

            socket.on("disconnect", () => {
                this._handleDisconnection(socket);
            });
        });
    }

    getConversationRoomId(userId1, userType1, userId2, userType2) {
        // Create a consistent room ID for a conversation between two users
        // Sort the IDs to ensure the same room ID regardless of order
        const users = [
            { id: userId1, type: userType1 },
            { id: userId2, type: userType2 }
        ].sort((a, b) => a.id.localeCompare(b.id));
        
        return `chat_${users[0].id}_${users[0].type}_${users[1].id}_${users[1].type}`;
    }

    async getActiveUsersInCenter(centerId) {
        const activeRadiologists = [];

        for (const [userId, userData] of this.activeUsers.entries()) {
            const centerRadiologistRelation = await CenterRadiologistsRelation.findOne({
                center: centerId,
                radiologist: userId
            });

            if (centerRadiologistRelation) {
                activeRadiologists.push({
                    userId,
                    userType: userData.userType,
                    lastActive: userData.lastActive
                });
            }
        }

        return activeRadiologists;
    }

    async _handleDisconnection(socket) {
        try {
            for (const [userId, userData] of this.activeUsers.entries()) {
                if (userData.socketId === socket.id) {
                    await Radiologist.findByIdAndUpdate(userId, {
                        status: "offline",
                        lastSeen: new Date()
                    });
                    this.activeUsers.delete(userId);
                    console.log(`User ${userId} disconnected`);
                    break;
                }
            }
        } catch (error) {
            console.error("Disconnection error:", error);
        }
    }

    async sendNotification(userId, userType, title, message, icon,name, type) {
        if (!this.isInitialized) {
            throw new Error("Socket.io not initialized. Call initialize() first");
        }

        try {
            const notification = await Notification.create({
                userId,
                userType,
                title,
                message,
                icon: icon ,
                sound: "" ,
                sendername: name ,
                type ,
                createdAt: new Date()   
            });

            const isDelivered = this._deliverNotification(userId, notification);
            
            return {
                success: true,
                notification,
                isDelivered,
                isOnline: isDelivered
            };
        } catch (error) {
            console.error("Notification creation failed:", error);
            throw error;
        }
    }

    _deliverNotification(userId, notification) {
        const user = this.activeUsers.get(userId.toString());
        if (user) {
            this.io.to(user.socketId).emit("rich_notification", {
                ...notification.toObject(),
                timestamp: new Date()
            });
            console.log(`Notification delivered to ${userId}`);
            return true;
        }
        return false;
    }

    async getUnreadNotifications(userId, limit = 20) {
        try {
            return await Notification.find({
                userId,
                isRead: false
            })
            .sort({ createdAt: -1 })
            .limit(limit);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
            throw error;
        }
    }

    async markAsRead(notificationId) {
        try {
            const result = await Notification.findByIdAndUpdate(
                notificationId,
                { isRead: true },
                { new: true }
            );
            return !!result;
        } catch (error) {
            console.error("Failed to mark as read:", error);
            throw error;
        }
    }
}
// 

module.exports = new NotificationManager();