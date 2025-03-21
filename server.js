const dotenv = require("dotenv");
const express = require("express");
const connectDB = require("./config/db.config");
const { createServer } = require("http");
const app = require("./app");
const { initializeSocket } = require("./middleware/socketManager");

dotenv.config({ path: "./config.env" });

const httpServer = createServer(app);
const io = initializeSocket(httpServer);

connectDB();

const port = 8000 || process.env.PORT ;

httpServer.listen(port, () => {
  console.log(`App is running on port: ${port}`);
});
