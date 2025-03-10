const express = require("express");
const mongoose = require("mongoose");
const AIReport = require("../models/AIReports.Model.js"); // Adjust the path if needed
const axios = require("axios");
const router = express.Router();

// Create AIReport
  exports.createAIReport = async (req, res) => {
    try {
      const { record ,centerId,radiologistID} = req.body;
      const newReport = new AIReport({
      record: record,
      centerId: centerId,
      radiologistID: radiologistID
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
exports.analyzeImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageUrl } = req.body;

    const aiReport = await AIReport.findById(id);
    if (!aiReport) {
      return res.status(404).json({ error: "AI Report not found" });
    }

    // Run all API calls in parallel
    const [findingResponse, imprationResponse, commentResponse] = await Promise.all([
      axios.post("https://llama-9xgzsq.fly.dev/Radio/", {
        text: "Describe the findings of this image in detail.",
        image_url: imageUrl
      }, { timeout: 100000 }),

      axios.post("https://llama-9xgzsq.fly.dev/Radio/", {
        text: "Provide the diagnostic impression based on the image.",
        image_url: imageUrl
      }, { timeout: 100000 }),

      axios.post("https://llama-9xgzsq.fly.dev/Radio/", {
        text: "Write additional comments or observations regarding the diagnosis.",
        image_url: imageUrl
      }, { timeout: 100000 })
    ]);

    aiReport.diagnosisReportFinding = findingResponse.data.diagnosis || "";
    aiReport.diagnosisReportImpration = imprationResponse.data.diagnosis || "";
    aiReport.diagnosisReportComment = commentResponse.data.diagnosis || "";

    // Save without blocking response
    aiReport.save().catch(err => console.error("Error saving AI report:", err));

    res.status(200).json(aiReport);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.analyzeFindings = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const response = await axios.post("https://graduation-project-ml-api.vercel.app/analyze-image", {
      text: "Describe the findings of this image in detail.",
      image_url: imageUrl
    }, { timeout: 100000 });

    res.status(200).json({ findings: response.data.diagnosis || "" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.analyzeImpression = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const response = await axios.post("https://graduation-project-ml-api.vercel.app/analyze-image", {
      text: "Provide the diagnostic impression based on the image.",
      image_url: imageUrl
    }, { timeout: 100000 });

    res.status(200).json({ impression: response.data.diagnosis || "" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.analyzeComments = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const response = await axios.post("https://graduation-project-ml-api.vercel.app/analyze-image", {
      text: "Write additional comments or observations regarding the diagnosis.",
      image_url: imageUrl
    }, { timeout: 100000 });

    res.status(200).json({ comments: response.data.diagnosis || "" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};




module.exports = exports;
