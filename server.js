require("dotenv").config({ path: "./config.env" });
const express = require("express");
const connectDB = require("./config/db.config");
const http = require("http");
const app = require("./app");
const { initializeSocket } = require("./middleware/socketManager");

const server = http.createServer(app);
const io = initializeSocket(server);

// الاتصال بقاعدة البيانات
connectDB();

// ✅ لا تقم بتشغيل `server.listen()` عند تشغيل الكود على Vercel  
if (process.env.NODE_ENV !== "vercel") {
  const port =  8000 || process.env.PORT ;
  server.listen(port, () => console.log(`App running on port ${port}`));
}

module.exports = server;
