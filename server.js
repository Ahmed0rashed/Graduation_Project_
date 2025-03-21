const dotenv = require("dotenv");
const express = require("express");
const connectDB = require("./config/db.config");
dotenv.config({ path: "./config.env" });
const { createServer } = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const Radiologist = require('./models/Radiologists.Model'); 
const chatController = require('./controllers/Massage.controller');

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

chatController.setSocketIO(io);

const activeUsers = new Map();

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
    io.emit('newMessage', { sender: socket.id, content: "Test message from server4" });
    console.log('message sent');
  }, 5000);
});

connectDB();

const port = process.env.PORT || 8000;

httpServer.listen(port, () => {
  console.log(`App is running on port: ${port}`);
});

module.exports = activeUsers;
