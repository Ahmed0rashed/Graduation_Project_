const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });

const connectDB = async () => {
  try {
    const DB = process.env.DATABASE || 
      "mongodb+srv://Ahmed:j3JufYo3YV20IGWT@cluster0.9dk5j.mongodb.net/Radio?retryWrites=true&w=majority&appName=Cluster0";

    // Connection options for production
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      retryWrites: true,
      w: 'majority'
    };

    await mongoose.connect(DB, options);

    console.log(`Connected to MongoDB successfully!`);

    // Connection event handlers
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    mongoose.connection.once("open", async () => {
      console.log("Connection to database established!");
      if (process.env.NODE_ENV !== 'production') {
        try {
          const result = await mongoose.connection.db.admin().listDatabases();
          console.log("Databases:", result.databases);
        } catch (err) {
          console.error("Error listing databases:", err);
        }
      }
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (err) {
    console.error("Error connecting to MongoDB:", err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
