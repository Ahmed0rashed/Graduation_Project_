const cloudinary = require("cloudinary").v2;
const RadiologyCenter = require("../models/Radiology_Centers.Model");
const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const Wallet = require('../models/payment/Wallet.Model');

cloudinary.config({
  cloud_name: "dncawa23w",
  api_key: "451913596668632",
  api_secret: "KboaQ-CpKdNpD0oJ0JvAagR3N_4",
});

class RadiologyCenterController {
  async uploadImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      console.log("Received file:", req.file);
      console.log("Request ID:", req.params.id);

      const result = await cloudinary.uploader
        .upload_stream(
          { folder: "radiology_centers" },
          async (error, result) => {
            if (error) {
              console.error("Cloudinary Upload Error:", error);
              return res.status(500).json({
                message: "Cloudinary upload failed",
                error: error.message,
              });
            }

            console.log("Cloudinary response:", result);

            const center = await RadiologyCenter.findById(req.params.id);
            if (!center) {
              return res.status(404).json({ message: "Center not found" });
            }

            center.path = result.secure_url;
            await center.save();

            res.status(200).json({
              message: "Image uploaded successfully",
              url: result.secure_url,
            });
          }
        )
        .end(req.file.buffer);
    } catch (error) {
      console.error("Server error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  async getImage(req, res) {
    try {
      const center = await RadiologyCenter.findById(req.params.id);
      if (!center) {
        return res.status(404).json({ message: "Center not found" });
      }

      console.log("Image URL from DB:", center.path);

      res.status(200).json({
        message: "Image retrieved successfully",
        imageUrl: center.path,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
  // Get all centers
  async getAllCenters(req, res) {
    try {
      const { status, city, search, limit = 10, page = 1 } = req.query;

      let query = {};

      // Build query filters
      if (status) {
        query.status = status;
      }
      if (city) {
        query["address.city"] = new RegExp(city, "i");
      }
      if (search) {
        query.$text = { $search: search };
      }

      const skip = (page - 1) * limit;

      // Execute query with pagination and sorting
      const [centers, total] = await Promise.all([
        RadiologyCenter.find(query)
          .skip(skip)
          .limit(parseInt(limit))
          .sort({ name: 1 }),
        RadiologyCenter.countDocuments(query),
      ]);
      // Send response
      res.json({
        data: centers,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      });
    } catch (error) {
      console.error("Error in getAllCenters:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to retrieve radiology centers",
      });
    }
  }

  // Get center by ID
  async getCenterById(req, res) {
    try {
      const { id } = req.params;

      // Validate ID
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          error: "Invalid ID",
          message: "The provided center ID is not valid",
        });
      }

      const center = await RadiologyCenter.findById(id);

      if (!center) {
        return res.status(404).json({
          error: "Not Found",
          message: "Radiology center not found",
        });
      }
      // Send response
      res.json({ data: center });
    } catch (error) {
      console.error("Error in getCenterById:", error);
      res.status(500).json({
        error: "Internal Server Error",
        message: "Failed to retrieve radiology center",
      });
    }
  }

  // Create center
  // Create center
  async createCenter(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation Error",
          details: errors.array(),
        });
      }

      const centerData = req.body;

      // Check for existing email
      const existingEmail = await RadiologyCenter.findOne({ email: centerData.email });
      if (existingEmail) {
        return res.status(409).json({
          error: "Conflict",
          message: `Email "${centerData.email}" is already registered`,
        });
      }

      const center = new RadiologyCenter(centerData);
      const newCenter = await center.save();

      const wallet = await Wallet.create({
        ownerId: newCenter._id,
        ownerType: 'RadiologyCenter',
      });

      newCenter.walletId = wallet._id;
      await newCenter.save();

      res.status(201).json({
        message: "Radiology center created successfully",
        data: {
          center: newCenter,
        },
      });
    } catch (error) {
      console.error("Error in createCenter:", error);
      if (error.code === 11000) {
        return res.status(409).json({
          error: "Conflict",
          message: "Duplicate value found",
          field: Object.keys(error.keyPattern)[0],
        });
      }
      res.status(400).json({
        error: "Bad Request",
        message: error.message,
      });
    }
  }
}

module.exports = new RadiologyCenterController();
