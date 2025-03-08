const express = require("express");
const mongoose = require("mongoose");
const Radiologist = require("../models/Radiologists.Model"); 
const { validationResult } = require('express-validator');
const router = express.Router();

class RadiologistController {

  // Get a radiologist by ID
   async getRadiologistById(req, res){
    try {
      const radiologist = await Radiologist.findById(req.params.id);
      if (!radiologist) return res.status(404).json({ message: "Radiologist not found" });
  
      res.status(200).json(radiologist);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // Edit a radiologist
  async editRadiologist(req, res) {
    try {
      const radiologist = await Radiologist.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!radiologist) return res.status(404).json({ message: "Radiologist not found" });
  
      res.status(200).json(radiologist);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };


  // Delete a radiologist by ID
  async deleteRadiologist(req, res) {
    try {
      const radiologist = await Radiologist.findById(req.params.id);
      if (!radiologist) return res.status(404).json({error: 'Not Found',message: 'Radiologist not found'});
      
     // Check for dependencies before deletion
      const hasReports = await Promise.all([
        require('../models/RadiologyRecords.Model').exists({ radiologist: req.params.id }),
      ]);
      
      // If any of the dependencies exist, return a conflict response
      if (hasReports.some(result => result)) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Cannot delete radiologist with associated records or reports'
        });
      }

      await radiologist.deleteOne();
      res.json({
        message: 'Radiologist deleted successfully'
      });
    } catch (error) {
      console.error('Error in deleteRadiologist:', error);
      if (error.kind === 'ObjectId') {
        return res.status(400).json({
          error: 'Invalid ID',
          message: 'The provided ID is not valid'
        });
      }
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message
      });
    }
  }

  // Update a radiologist
  async updateRadiologist(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation Error',
          details: errors.array()
        });
      }

      const updates = { ...req.body };
      delete updates._id;
      delete updates.passwordHash;

      const radiologist = await Radiologist.findById(req.params.id);
      if (!radiologist) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Radiologist not found'
        });
      }

      Object.keys(updates).forEach(update => {
        radiologist[update] = updates[update];
      });

      const updatedRadiologist = await radiologist.save();
      res.json({
        message: 'Radiologist updated successfully',
        data: updatedRadiologist.toJSON()
      });
    } catch (error) {
      console.error('Error in updateRadiologist:', error);
      if (error.code === 11000) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Duplicate value found',
          field: Object.keys(error.keyPattern)[0]
        });
      }
      res.status(400).json({
        error: 'Bad Request',
        message: error.message
      });
    }
  }


}



module.exports = new RadiologistController();
