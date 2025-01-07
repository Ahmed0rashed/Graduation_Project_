const mongoose = require("mongoose");
const dotenv = require("dotenv");

// تحميل متغيرات البيئة من ملف .env
dotenv.config({ path: "./config.env" });

// دالة الاتصال بقاعدة البيانات MongoDB
const connectDB = async () => {
  try {
    // استخدام متغير البيئة DATABASE للاتصال
    const DB =
      process.env.DATABASE ||
      "mongodb+srv://Ahmed:j3JufYo3YV20IGWT@cluster0.9dk5j.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

    // الاتصال بقاعدة البيانات
    await mongoose.connect(DB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`Connected to MongoDB successfully!`);

    // التحقق من الاتصال وعرض قواعد البيانات
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
