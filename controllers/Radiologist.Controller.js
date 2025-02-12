const express = require("express");
const mongoose = require("mongoose");
const AIReport = require("../models/Radiologists.Model"); 

const router = express.Router();



exports.getRadiologistById = async (req, res) => {
  try {
    const radiologist = await AIReport.findById(req.params.id);
    if (!radiologist) return res.status(404).json({ message: "Radiologist not found" });

    res.status(200).json(radiologist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};





module.exports = exports;
