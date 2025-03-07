const express = require("express");
const mongoose = require("mongoose");
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





module.exports = exports;
