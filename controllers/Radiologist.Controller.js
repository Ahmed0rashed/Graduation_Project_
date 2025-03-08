const express = require("express");
const mongoose = require("mongoose");
const Radiologist = require("../models/Radiologists.Model"); 
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "dncawa23w",
  api_key: "451913596668632",
  api_secret: "KboaQ-CpKdNpD0oJ0JvAagR3N_4",
});

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

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const center = await Radiologist.findById(req.params.id);
    if (!center) {
      return res.status(404).json({ message: "Radiologist not found" });
    }

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "Radiologist" },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });


    center.image = result.secure_url;
    await center.save();

    res.status(200).json({
      message: "Image uploaded successfully",
      url: result.secure_url,
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getImage = async (req, res) => {
  try {
    const center = await Radiologist.findById(req.params.id);
    if (!center) {
      return res.status(404).json({ message: "Center not found" });
    }

    res.status(200).json({
      message: "Image retrieved successfully",
      imageUrl: center.image,
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


module.exports = exports;
