const dotenv = require("dotenv");
const express = require("express");
const connectDB = require("./config/db.config");
dotenv.config({ path: "./config.env" });

const app = require("./app");

connectDB();

const port = 8000 || process.env.PORT;

app.listen(port, () => {
  console.log(`App is running on port: ${port}`);
});
