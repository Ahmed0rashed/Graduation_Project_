const dotenv = require("dotenv");
const express = require("express");
const connectDB = require("./config/db.config");
const http = require("http");
const app = require("./app");
const { initializeSocket } = require("./middleware/socketManager");

dotenv.config({ path: "./config.env" });

// التأكد من عدم تشغيل الخادم أكثر من مرة
if (!global.serverInstance) {
  const server = http.createServer(app);
  global.serverInstance = server; // تخزين المرجع لتجنب التشغيل المكرر

  const io = initializeSocket(server);

  connectDB();

  const port = process.env.PORT || 8000;

  server.listen(port, () => console.log(`✅ Server running on port ${port}`));
} else {
  console.log("🚨 Server is already running!");
}

module.exports = global.serverInstance;
