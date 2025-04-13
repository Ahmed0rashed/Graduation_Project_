const { Server } = require("socket.io");
const Radiologist = require("../models/Radiologists.Model");

const activeUsers = new Map();
let io;

function initializeSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: ["http://localhost:8000", "https://graduation-project--xohomg.fly.dev/","http://127.0.0.1:5500"],
            methods: ["GET", "POST"],
            credentials: true
        },
        pingTimeout: 60000,
        pingInterval: 25000
    });

    io.on("connection", (socket) => {
        console.log(`✅ مستخدم متصل: ${socket.id}`);

        socket.on("userOnline", async ({ userId, userType }) => {
            try {
                await Radiologist.findByIdAndUpdate(userId, { status: "online" });

                activeUsers.set(userId, { socketId: socket.id, userType });

                console.log(`${userType} ${userId} is online`);

                io.emit("userStatusChange", {
                    userId,
                    userType,
                    status: "online"
                });
            } catch (error) {
                console.error("Error updating user status:", error.message);
            }
        });

        socket.on("disconnect", async () => {
            try {
                let disconnectedUserId = null;
                for (const [userId, userData] of activeUsers.entries()) {
                    if (userData.socketId === socket.id) {
                        disconnectedUserId = userId;
                        const userType = userData.userType;
                        activeUsers.delete(userId);

                        await Radiologist.findByIdAndUpdate(userId, { status: "offline" });

                        console.log(`${userType} ${userId} disconnected`);

                        io.emit("userStatusChange", {
                            userId,
                            userType,
                            status: "offline"
                        });

                        socket.leave(userId);
                        break;
                    }
                }
            } catch (error) {
                console.error("❌ Error handling disconnect:", error.message);
            }
        });
    });

    return io;
}

// ✅ دالة لإرسال إشعار لكل المستخدمين
function sendRichNotification(title, message, icon, sound) {
  if (!io) {
      console.error("❌ Socket.io غير مهيأ بعد!");
      return;
  }
  
  io.emit("receiveNotification", { title, message, icon, sound }); // 🔥 إرسال الإشعار بكامل تفاصيله
  
  console.log(`🔔 إشعار غني تم إرساله: ${title} - ${message}`);
}

function sendNotificationToUser(userId, userType, title, message, icon, sound) {
    if (!io) {
        console.error("❌ Socket.io غير مهيأ بعد!");
        return false;
    }

    // تحويل userId إلى سترينج للمقارنة الصحيحة
    const targetUserId = userId.toString();
    const targetUserType = userType.toLowerCase();

    // البحث في activeUsers
    for (const [id, data] of activeUsers.entries()) {
        if (id.toString() === targetUserId && 
            data.userType.toLowerCase() === targetUserType) {
            
            const notificationData = {
                title,
                message,
                icon: icon || 'https://cdn-icons-png.flaticon.com/512/1827/1827343.png',
                sound: sound || 'https://www.myinstants.com/media/sounds/notification-sound.mp3',
                timestamp: new Date(),
                userId: targetUserId,
                userType: targetUserType
            };

            console.log('📤 إرسال إشعار إلى:', {
                socketId: data.socketId,
                userId: targetUserId,
                userType: targetUserType,
                notification: notificationData
            });

            io.to(data.socketId).emit("rich_notification", notificationData);
            return true;
        }
    }

    console.log(`⚠️ المستخدم غير متصل: ${targetUserType} ${targetUserId}`);
    return false;
}


module.exports = { initializeSocket, activeUsers, sendRichNotification ,sendNotificationToUser};
