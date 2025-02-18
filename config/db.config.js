const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });

const connectDB = async () => {
  try {
    const DB =
      process.env.DATABASE ||
      "mongodb+srv://Ahmed:j3JufYo3YV20IGWT@cluster0.9dk5j.mongodb.net/Radio?retryWrites=true&w=majority&appName=Cluster0";

    await mongoose.connect(DB);

    console.log(`Connected to MongoDB successfully!`);

    mongoose.connection.once("open", async () => {
      console.log("Connection to database established!");
      try {
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
    process.exit(1);
  }
};

module.exports = connectDB;
