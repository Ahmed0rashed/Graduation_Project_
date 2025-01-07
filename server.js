const dotenv = require("dotenv");
const express = require("express");
const mongoose = require("mongoose");
const app = require("./app");

// Load environment variables from .env file
dotenv.config({ path: "./config.env" });

// MongoDB connection function optimized for serverless
const connectDB = async () => {
  // Check if MongoDB is already connected
  if (mongoose.connection.readyState >= 1) {
    console.log("Already connected to MongoDB");
    return;
  }

  try {
    const DB =
      process.env.DATABASE ||
      "mongodb+srv://Ahmed:j3JufYo3YV20IGWT@cluster0.9dk5j.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

    // Connect to MongoDB (no deprecated options like useNewUrlParser and useUnifiedTopology)
    await mongoose.connect(DB);
    console.log("Connected to MongoDB successfully!");

    mongoose.connection.once("open", async () => {
      console.log("Connection to database established!");
      try {
        // List all databases once when the connection is first established
        const result = await mongoose.connection.db.admin().listDatabases();
        console.log("Databases:", result.databases);
        if (result.databases.length === 0) {
          console.log("No databases found. Try inserting data first.");
        }
      } catch (err) {
        console.error("Error listing databases:", err);
      }
    });
  } catch (err) {
    console.error("Error connecting to MongoDB:", err.message);
    process.exit(1); // Exit the process if connection fails
  }
};

// Connect to the database
connectDB();

// Define server port
const port = process.env.PORT || 8000;

// Start the server
app.listen(port, () => {
  console.log(`App is running on port: ${port}`);
});

module.exports = connectDB;
