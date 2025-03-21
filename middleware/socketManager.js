const { Server } = require("socket.io");
const Radiologist = require('../models/Radiologists.Model'); 

const activeUsers = new Map();

function initializeSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*", 
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('Radiologist connected', socket.id);

    socket.on('userOnline', async ({ userId, userType }) => {
      try {
        await Radiologist.findByIdAndUpdate(userId, { status: 'online' });

        activeUsers.set(userId, { socketId: socket.id, userType });

        console.log(`${userType} ${userId} connected`);

        io.emit('userStatusChange', {
          userId,
          userType,
          status: 'online'
        });
      } catch (error) {
        console.error('Error updating user status:', error.message);
      }
    });

    socket.on('disconnect', async () => {
      try {
        let disconnectedUserId = null;
        for (const [userId, userData] of activeUsers.entries()) {
          if (userData.socketId === socket.id) {
            disconnectedUserId = userId;
            const userType = userData.userType;
            activeUsers.delete(userId);

            await Radiologist.findByIdAndUpdate(userId, { status: 'offline' });

            console.log(`${userType} ${userId} disconnected`);

            io.emit('userStatusChange', {
              userId,
              userType,
              status: 'offline'
            });
            break;
          }
        }
      } catch (error) {
        console.error('Error handling disconnect:', error.message);
      }
    });

    setTimeout(() => {
      io.emit('newMessage', { sender: socket.id, content: "Test message from server" });
      console.log('Message sent');
    }, 5000);
  });

  return io;
}

module.exports = { initializeSocket, activeUsers };
