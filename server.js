const dotenv = require("dotenv");
const express = require("express");
const connectDB = require("./config/db.config");
const { createServer } = require("http");
const app = require("./app");
const notificationManager = require("./middleware/notfi");

dotenv.config({ path: "./config.env" });

const httpServer = createServer(app);

connectDB();

notificationManager.initialize(httpServer);

const port =8000|| process.env.PORT ;
httpServer.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Socket.io status: ${notificationManager.isInitialized ? "READY" : "NOT READY"}`);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});