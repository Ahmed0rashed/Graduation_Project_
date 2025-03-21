const socketIO = require("socket.io");
const Radiologist = require("../models/Radiologists.Model");
const activeUsers = new Map();

let io;

function initializeSocket(server) {
  io = socketIO(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  io.on("connection", (socket) => {
    console.log("Radiologist connected", socket.id);

    socket.on("userOnline", async ({ userId, userType }) => {
      try {
        await Radiologist.findByIdAndUpdate(userId, { status: "online" });
        activeUsers.set(userId, { socketId: socket.id, userType });

        io.emit("userStatusChange", { userId, userType, status: "online" });
      } catch (error) {
        console.error("Error updating user status:", error.message);
      }
    });

    socket.on("disconnect", async () => {
      let disconnectedUserId = null;
      for (const [userId, userData] of activeUsers.entries()) {
        if (userData.socketId === socket.id) {
          disconnectedUserId = userId;
          activeUsers.delete(userId);

          await Radiologist.findByIdAndUpdate(userId, { status: "offline" });

          io.emit("userStatusChange", { userId, status: "offline" });
          break;
        }
      }
    });
  });

  return io;
}

module.exports = { initializeSocket, io, activeUsers };
