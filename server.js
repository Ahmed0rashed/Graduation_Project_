const dotenv = require("dotenv");
const express = require("express");
const connectDB = require("./config/db.config");
const http = require("http");
const app = require("./app");
const { initializeSocket } = require("./middleware/socketManager");

dotenv.config({ path: "./config.env" });

const server = http.createServer(app);
const io = initializeSocket(server);

connectDB();

const port = process.env.PORT || 8000;
server.listen(port, () => console.log(`App running on port ${port}`));

module.exports = { io };
