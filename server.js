const dotenv = require("dotenv");
const express = require("express");
const connectDB = require("./config/db.config");
const { createServer } = require("http");
const app = require("./app");

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { setClient } = require('./middleware/whats');

const notificationManager = require("./middleware/notfi");

dotenv.config({ path: "./config.env" });

const port = process.env.PORT || 3000;

const httpServer = createServer(app);


connectDB();

notificationManager.initialize(httpServer);

httpServer.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Socket.io status: ${notificationManager.isInitialized ? "READY" : "NOT READY"}`);
});


const client = new Client({
  authStrategy: new LocalAuth()
});


client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
});


client.on('ready', () => {
  console.log('✅ WhatsApp Client is ready');
  setClient(client);  
});

// بدء تهيئة الـ client
client.initialize();

// معالجة الأخطاء العامة
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});
