const dotenv = require("dotenv");
const express = require("express");
const connectDB = require("./config/db.config");

dotenv.config({ path: "./config.env" });

const app = require("./app");

connectDB();

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`App is running on port: ${port}`);
});
