const express = require("express");
const mongoose = require("mongoose");
const RadiologyRecord = require("../models/RadiologyRecords.Model"); 

const router = express.Router();

exports.addRecord = async (req, res) => {
  try {
    const { centerId, patient_name, study_date, patient_id, sex, modality, PatientBirthDate, age, study_description ,email,DicomId} = req.body;

    const record = await RadiologyRecord.create({
      centerId,
      patient_name,
      study_date,
      patient_id, 
      sex, 
      modality,
      PatientBirthDate,
      age,
      study_description,
      email,
      DicomId
    });
const savedRecord = await record.save();
    res.status(200).json(savedRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = exports;
 