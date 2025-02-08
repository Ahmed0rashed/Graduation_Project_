const express = require("express");
const mongoose = require("mongoose");
const AIReport = require("../models/RadiologyRecords.Model"); 

const router = express.Router();

exports.addRecord = async (req, res) => {
  try {
    const { centerId, patient_name, study_date, patient_id, sex, modality, PatientBirthDate, age, study_description ,email} = req.body;

    if (!centerId || !patient_name || !study_date || !patient_id || !sex || !modality || !PatientBirthDate || !age || !study_description || !email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const record = await AIReport.create({
      center: centerId,
      patient_name,
      study_date,
      patient_id, 
      sex, 
      modality,
      PatientBirthDate,
      age,
      study_description,
      email,
    });
const savedRecord = await record.save();
    res.status(200).json(savedRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


module.exports = exports;
 