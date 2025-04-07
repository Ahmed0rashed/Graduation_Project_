const { Server } = require("socket.io");
const Radiologist = require("../models/Radiologists.Model");
const Notification = require("../models/not.model");

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
                    "http://127.0.0.1:5500/te5.html"
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
                    
                } catch (error) {
                    console.error("Connection error:", error);
                    socket.emit("connectionError", { error: "Failed to establish connection" });
                }
            });

            socket.on("disconnect", () => {
                this._handleDisconnection(socket);
            });
        });
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

    async sendNotification(userId, userType, title, message, icon, sound) {
        if (!this.isInitialized) {
            throw new Error("Socket.io not initialized. Call initialize() first");
        }

        try {
            const notification = await Notification.create({
                userId,
                userType,
                title,
                message,
                icon: icon || 'https://cdn-icons-png.flaticon.com/512/1827/1827343.png',
                sound: sound || 'https://www.myinstants.com/media/sounds/notification-sound.mp3',
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

module.exports = new NotificationManager();