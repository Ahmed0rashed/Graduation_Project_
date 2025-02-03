const mongoose = require("mongoose");
const dotenv = require("dotenv");


require('dotenv').config({ path: __dirname + '/config.env' }); 



const connectDB = async () => {
  try {
    const DB =process.env.DATABASE ;


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
