const express = require("express");
const mongoose = require("mongoose");
const AIReport = require("../models/AIReports.Model.js"); // Adjust the path if needed

const router = express.Router();

// Create AIReport
exports.createAIReport = async (req, res) => {
  try {
    const { record } = req.body;
    const newReport = new AIReport({
      record: record,
      generatedDate: generatedDate || new Date(), // Default to current date
    });
    const savedReport = await newReport.save();
    res.status(201).json(savedReport);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update AIReport
exports.updateAIReport = async (req, res) => {
  try {
    const stutes = req.body;
    if (!stutes) return res.status(400).json({ message: "Stutes are required" });
    const updatedReport = await AIReport.findByIdAndUpdate(
      req.params.id,
      stutes,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!updatedReport) return res.status(404).json({ message: "Report not found" });
    res.status(200).json(updatedReport);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Read AIReport by ID
exports.getOneAIReport = async (req, res) => {
  try {
    const report = await AIReport.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });

    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Read AIReports with Specific Result
exports.getAllAIReportsByResult = async (req, res) => {
  try {
    const { result } = req.params;
    if (!result)
      return res.status(400).json({ error: "Result status is required" });
    const reports = await AIReport.find({ result: result, }).populate("result").sort({ createdAt: -1 });
    res.status(200).json({
      numOfAIReports: reports.length,
      reports,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete AIReport
exports.deleteAIReport = async (req, res) => {
  try {
    const deletedReport = await AIReport.findById(req.params.id);
    if (!deletedReport)
      return res.status(404).json({ message: "Report not found" });
    deletedReport.deleted = true;
    res.status(200).json({ message: "Report deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = exports;
