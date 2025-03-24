const express = require("express");
const mongoose = require("mongoose");
const Radiologist = require("../models/Radiologists.Model"); 
const cloudinary = require("cloudinary").v2;
const activeUsers =require("../server");
cloudinary.config({
  cloud_name: "dncawa23w",
  api_key: "451913596668632",
  api_secret: "KboaQ-CpKdNpD0oJ0JvAagR3N_4",
});

const router = express.Router();

class RadiologistController {
  // Get a radiologist by ID
  async getRadiologistById(req, res) {
    try {
      const radiologist = await Radiologist.findById(req.params.id);
      if (!radiologist) return res.status(404).json({ message: "Radiologist not found" });
  
      res.status(200).json(radiologist);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Edit a radiologist
  async editRadiologist(req, res) {
    try {
      const radiologist = await Radiologist.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!radiologist) return res.status(404).json({ message: "Radiologist not found" });
  
      res.status(200).json(radiologist);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Delete a radiologist by ID
  async deleteRadiologist(req, res) {
    try {
      const radiologist = await Radiologist.findById(req.params.id);
      if (!radiologist) return res.status(404).json({ error: 'Not Found', message: 'Radiologist not found' });
      
      const hasReports = await require('../models/RadiologyRecords.Model').exists({ radiologist: req.params.id });
      
      if (hasReports) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Cannot delete radiologist with associated records or reports'
        });
      }

      await radiologist.deleteOne();
      res.json({ message: 'Radiologist deleted successfully' });
    } catch (error) {
      console.error('Error in deleteRadiologist:', error);
      if (error.kind === 'ObjectId') {
        return res.status(400).json({ error: 'Invalid ID', message: 'The provided ID is not valid' });
      }
      res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
  }

  // Update a radiologist
  async updateRadiologist(req, res) {
    try {
      const updates = { ...req.body };
      delete updates._id;
      delete updates.passwordHash;

      const radiologist = await Radiologist.findById(req.params.id);
      if (!radiologist) {
        return res.status(404).json({ error: 'Not Found', message: 'Radiologist not found' });
      }

      Object.keys(updates).forEach(update => {
        radiologist[update] = updates[update];
      });

      const updatedRadiologist = await radiologist.save();
      res.json({ message: 'Radiologist updated successfully', data: updatedRadiologist.toJSON() });
    } catch (error) {
      console.error('Error in updateRadiologist:', error);
      if (error.code === 11000) {
        return res.status(409).json({ error: 'Conflict', message: 'Duplicate value found', field: Object.keys(error.keyPattern)[0] });
      }
      res.status(400).json({ error: 'Bad Request', message: error.message });
    }
  }

  // Upload an image
  async uploadImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const radiologist = await Radiologist.findById(req.params.id);
      if (!radiologist) {
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

      radiologist.image = result.secure_url;
      await radiologist.save();

      res.status(200).json({ message: "Image uploaded successfully", url: result.secure_url, statusCode:200 });
    } catch (error) {
      console.error("Server error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  
  async getImage(req, res) {
    try {
      const radiologist = await Radiologist.findById(req.params.id);
      if (!radiologist) {
        return res.status(404).json({ message: "Radiologist not found" });
      }

      res.status(200).json({ message: "Image retrieved successfully", imageUrl: radiologist.image });
    } catch (error) {
      console.error("Server error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

} 



module.exports = new RadiologistController();

