const express = require('express');
const mongoose = require('mongoose');
const AIReport = require('../models/AIReports.Model.js'); // Adjust the path if needed
// Assuming your schema is in models/AIReport.js

const router = express.Router();

// Create AIReport
exports.createAIReport = async (req, res) => {
  try {
    const { record, diagnosisReport, confidenceLevel, generatedDate } = req.body;

    if (!record || !diagnosisReport || !confidenceLevel) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newReport = new AIReport({ record, diagnosisReport, confidenceLevel, generatedDate });
    const savedReport = await newReport.save();
    res.status(201).json(savedReport);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Read All AIReports
exports.getAllAIReports = async (req, res) => {
  try {
    const reports = await AIReport.find()||[];
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Read AIReport by ID
exports.getOneAIReport = async (req, res) => {
  try {
    const report = await AIReport.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update AIReport
exports.UpdateAIReport = async (req, res) => {
  try {
    const updatedReport = await AIReport.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedReport) return res.status(404).json({ message: 'Report not found' });
    res.status(200).json(updatedReport);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete AIReport
exports.deleteAIReport = async (req, res) => {
  try {
    const deletedReport = await AIReport.findByIdAndDelete(req.params.id);
    if (!deletedReport) return res.status(404).json({ message: 'Report not found' });
    res.status(200).json({ message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = exports;
