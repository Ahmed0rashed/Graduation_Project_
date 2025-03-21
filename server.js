require("dotenv").config({ path: "./config.env" });
const express = require("express");
const connectDB = require("./config/db.config");
const http = require("http");
const app = require("./app");
const { initializeSocket } = require("./middleware/socketManager");

// إنشاء الخادم
const server = http.createServer(app);
const io = initializeSocket(server);

// الاتصال بقاعدة البيانات
connectDB();

// تشغيل الخادم على المنفذ المحدد
const port = process.env.PORT || 8000;
server.listen(port, () => console.log(`App running on port ${port}`));

// ✅ تصدير الخادم بشكل افتراضي ليكون متوافقًا مع Vercel
module.exports = server;
