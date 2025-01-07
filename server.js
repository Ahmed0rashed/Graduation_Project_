const dotenv = require("dotenv");
const express = require("express");
const mongoose = require("mongoose");
const app = require("./app");

// تحميل متغيرات البيئة من ملف .env
dotenv.config({ path: "./config.env" });

// دالة الاتصال بقاعدة البيانات MongoDB
const connectDB = async () => {
  // التأكد لو قاعدة البيانات متصلة بالفعل
  if (mongoose.connection.readyState >= 1) {
    console.log("Already connected to MongoDB");
    return;
  }

  try {
    const DB =
      process.env.DATABASE ||
      "mongodb+srv://Ahmed:j3JufYo3YV20IGWT@cluster0.9dk5j.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

    // الاتصال بقاعدة البيانات بدون إعدادات قديمة
    await mongoose.connect(DB);
    console.log("Connected to MongoDB successfully!");

    mongoose.connection.once("open", async () => {
      console.log("Connection to database established!");
      try {
        // عرض قواعد البيانات مرة واحدة عند أول اتصال
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
    process.exit(1); // الخروج من البرنامج لو حصل خطأ في الاتصال
  }
};

// الاتصال بقاعدة البيانات
connectDB();

// تحديد البورت
const port = process.env.PORT || 8000;

// تشغيل السيرفر
app.listen(port, () => {
  console.log(`App is running on port: ${port}`);
});

module.exports = connectDB;
