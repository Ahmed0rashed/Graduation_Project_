const express = require("express");
const multer = require("multer");
const path = require("path");
const Radiologist = require("../models/Radiologists.Model"); 

const router = express.Router();



exports.getRadiologistById = async (req, res) => {
  try {
    const radiologist = await Radiologist.findById(req.params.id);
    if (!radiologist) return res.status(404).json({ message: "Radiologist not found" });

    res.status(200).json(radiologist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.editRadiologist = async (req, res) => {
  try {
    const radiologist = await Radiologist.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!radiologist) return res.status(404).json({ message: "Radiologist not found" });

    res.status(200).json(radiologist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

////Dont removew ❌❌
// ✅  إعداد Multer لحفظ الصور
const storage = multer.diskStorage({
  destination: "./uploads", // تحديد مكان حفظ الصور
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname)); // إعادة تسمية الملف
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("❌ الملف يجب أن يكون صورة"), false);
  }
});
const updateRadiologistImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "❌ لم يتم رفع صورة" });
    }

    const imageUrl = `https://your-server.com/uploads/${req.file.filename}`; // رابط الصورة

    const doctor = await Radiologist.findByIdAndUpdate(
      req.params.id,
      { image: imageUrl },
      { new: true }
    );

    res.status(200).json({ message: "✅ تم تحديث الصورة بنجاح", doctor });
  } catch (error) {
    res.status(500).json({ message: "❌ خطأ أثناء تحديث الصورة", error });
  }
};



module.exports = exports;
