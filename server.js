const dotenv = require("dotenv"); 
const express = require("express");
const mongoose = require("mongoose");
const app = require("./app");

// dotenv.config({ path: "./config.env" }); 


const connectDB = async () => {
  try {
    const DB = "mongodb+srv://Ahmed:j3JufYo3YV20IGWT@cluster0.9dk5j.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
    await mongoose.connect(DB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB successfully!");

    mongoose.connection.once("open", () => {
      console.log("Connection to database established!");

      mongoose.connection.db.admin().listDatabases((err, result) => {
        if (err) {
          console.error("Error listing databases:", err);
        } else {
          console.log("Databases:", result.databases);
          if (result.databases.length === 0) {
            console.log("No databases found. Try inserting data first.");
          }
        }
      });
    });
  } catch (err) {
    console.error("Error connecting to MongoDB:", err.message);
    process.exit(1);
  }
};

// Connect to database
// connectDB();

const port = process.env.PORT || 8000;

// Start server
app.listen(port, () => {
  console.log(`App is running on port: ${port}`);
});

module.exports = connectDB;
