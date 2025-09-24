const dotenv = require("dotenv");
const express = require("express");
const connectDB = require("./config/db.config");
const { createServer } = require("http");
const app = require("./app");
const notificationManager = require("./middleware/notfi");
const startDeadlineChecker = require("./middleware/checkDeadlines"); 
const { setSocketIO } = require("./controllers/Massage.controller");

// Load environment variables
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: "./config.env" });
}

const httpServer = createServer(app);

connectDB();

// Initialize WebSocket
const io = notificationManager.initialize(httpServer);

// Set WebSocket instance for message controller
setSocketIO(io);

startDeadlineChecker();

const port = process.env.PORT || 3000;
const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

httpServer.listen(port, host, () => {
  console.log(`🚀 Server running on ${host}:${port}`);
  console.log(`📡 Socket.io status: ${notificationManager.isInitialized ? "READY" : "NOT READY"}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});
