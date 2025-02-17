const express = require("express");
const mongoose = require("mongoose");
const RadiologyRecord = require("../models/RadiologyRecords.Model"); 
const AIReport = require("../models/AIReports.Model");


const router = express.Router();

exports.addRecord = async (req, res) => {
  try {
    const { 
      centerId, patient_name, study_date, patient_id, sex, modality, 
      PatientBirthDate, age, study_description, email, DicomId, series, 
      radiologistId, body_part_examined 
    } = req.body;

    
    const record = await RadiologyRecord.create({
      centerId,
      radiologistId,
      patient_name,
      study_date,
      patient_id, 
      sex, 
      modality,
      PatientBirthDate,
      age,
      study_description,
      email,
      body_part_examined,
      series,
      DicomId
    });

    const savedRecord = await record.save();

  
    const aiReport = await AIReport.create({
      record: savedRecord._id, 
      diagnosisReport:" ", 
      confidenceLevel:0.0, 
      generatedDate: new Date(),
    });

    const savedAIReport = await aiReport.save();

    
    res.status(200).json({ record: savedRecord, aiReport: savedAIReport });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



exports.getRecordsByCenterId = async (req, res) => {
  const { id } = req.params;

  try {
    const records = await RadiologyRecord.find({ centerId : id }).sort({ createdAt: -1 });
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getRecordById = async (req, res) => {
  const { id } = req.params;

  try { 
    const record = await RadiologyRecord.findById(id);  
    res.status(200).json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.deleteRecordById = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedRecord = await RadiologyRecord.findByIdAndDelete(id);
    if (!deletedRecord)
      return res.status(404).json({ message: "Record not found" });

    res.status(200).json({ message: "Record deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getNumberOfRecords = async (req, res) => {
  const { id } = req.params;

  try {
    const count = await RadiologyRecord.countDocuments({ centerId: id });
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getRecordsByRediologyId = async (req, res) => {
  const { id } = req.params;

  try {
    const records = await RadiologyRecord.find({ radiologistId : id }).sort({ createdAt: -1 });
    res.status(200).json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



module.exports = exports;
