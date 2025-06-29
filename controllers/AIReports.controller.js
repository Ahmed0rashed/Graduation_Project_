const express = require("express");
const mongoose = require("mongoose");
const AIReport = require("../models/AIReports.Model.js"); 
const RadiologyRecord = require("../models/RadiologyRecords.Model"); 
const Radiologist = require("../models/Radiologists.Model");
const notificationManager = require('../middleware/notfi');
const RadiologyCenter = require("../models/Radiology_Centers.Model.js");
const axios = require("axios");
const router = express.Router();


const sendNotification = async (userId, userType, title, message,image,centername, type) => {
  try {
    const result = await notificationManager.sendNotification(
      userId,
      userType,
      title,
      message,
      image,
      centername,
      type
    );

    return result;
  } catch (error) {
    console.error("Notification error:", error);
    throw error;
  }
};


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
exports.updateAIReport1 = async (req, res) => {
  try {
    const {
      diagnosisReportFinding,
      diagnosisReportImpration,
      diagnosisReportComment
    } = req.body;

    const foundrecord = await RadiologyRecord.findById(req.params.id);
    if (!foundrecord) {
      return res.status(404).json({ message: "Record not found" });
    }

    const foundRadiologist = await Radiologist.findById(foundrecord.radiologistId);
    if (!foundRadiologist) {
      return res.status(404).json({ message: "Radiologist not found" });
    }

    const center = await RadiologyCenter.findById(foundrecord.centerId);
    if (!center) {
      return res.status(404).json({ message: "Center not found" });
    }

    const spec = foundrecord.specializationRequest;
    if (!foundRadiologist.numberOfReports[spec]) {
      foundRadiologist.numberOfReports[spec] = [];
    }

    foundRadiologist.numberOfReports[spec].push(new Date());
    await foundRadiologist.save();

    const foundAIReport = foundrecord.reportId;
    const updatedAIReport = await AIReport.findByIdAndUpdate(
      foundAIReport,
      {
        diagnosisReportFinding,
        diagnosisReportImpration,
        diagnosisReportComment,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    const notificationResult = await sendNotification(
      center._id,
      "ٌRadiologyCenter",
      "new study completed",
      `You have a study completed from ${foundRadiologist.firstName} ${foundRadiologist.lastName}`,
      foundRadiologist.image,
      center.centerName,
      "study"
    );

    if (notificationResult?.save) {
      await notificationResult.save();
    }

    await RadiologyRecord.findByIdAndUpdate(
      foundrecord._id,
      { status: "Completed" },
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedAIReport);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};



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
};exports.analyzeImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageUrl } = req.body;

    const aiReport = await AIReport.findById(id);
    if (!aiReport) {
      return res.status(404).json({ error: "AI Report not found" });
    }

    const [findingResponse, impressionResponse, recommendationResponse] = await Promise.all([
      axios.post("https://llama-9xgzsq.fly.dev/Radio/", {
        text: "Provide only the medical findings from this image without explanations, instructions, or steps.",
        image_url: imageUrl
      }, { timeout: 100000 }),

      axios.post("https://llama-9xgzsq.fly.dev/Radio/", {
        text: "Provide the diagnostic impression based on the image without additional details or steps.",
        image_url: imageUrl
      }, { timeout: 100000 }),

      axios.post("https://llama-9xgzsq.fly.dev/Radio/", {
        text: "Provide only the necessary medical recommendations in short based on the findings and diagnostic impression of this image without listing without say finding information and impression information.",
        image_url: imageUrl
      }, { timeout: 100000 })
    ]);

    const cleanText = (text) => text.replace(/\*/g, "").trim();

    const finding = cleanText(findingResponse.data.response || "");
    const impression = cleanText(impressionResponse.data.response || "");
    const recommendation = cleanText(recommendationResponse.data.response || "");

    aiReport.diagnosisReportFinding = finding;
    aiReport.diagnosisReportImpration = impression;
    aiReport.diagnosisReportComment = recommendation;

    await aiReport.save();

    res.status(200).json(aiReport);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const chunkArray = (arr, size) => {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};
exports.analyzeImage1 = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageUrl } = req.body;

    if (!Array.isArray(imageUrl) || imageUrl.length === 0) {
      return res.status(400).json({ error: "imageUrl must be a non-empty array of URLs." });
    }

    const aiReport = await AIReport.findById(id);
    if (!aiReport) {
      return res.status(404).json({ error: "AI Report not found" });
    }

    const promptFinding = "Provide only the medical findings from this image without explanations, instructions, or steps and dont say Image Analysis Report and dont say any thing just findings and dont say Patient Information and Analyze only the new images..";
    const promptImpression = "Provide the diagnostic impression based on the image without explanations, instructions, or steps and dont say Image Analysis Report and dont say any thing just impression and dont say Patient Information and Analyze only the new images..";

    const imageChunks = chunkArray(imageUrl, 3); 

    let fullFinding = "";
    
    let fullImpression = "";

    for (const chunk of imageChunks) {
      const [findingRes, impressionRes] = await Promise.all([
        axios.post("https://aaf5-41-68-141-45.ngrok-free.app/analyze-image-urls/", {
          prompt: promptFinding,
          image_urls: chunk
        }, { timeout: 100000 }),

        axios.post("https://aaf5-41-68-141-45.ngrok-free.app/analyze-image-urls/", {
          prompt: promptImpression,
          image_urls: chunk
        }, { timeout: 100000 }),
      ]);

      const rawFinding = findingRes.data?.result || '';
      const rawImpression = impressionRes.data?.result || '';

      const cleanText = (text) => {
        return typeof text === 'string'
          ? text.replace(/(\*\*.*?\*\*|\n|\*|:)/g, "").trim()
          : '';
      };

      fullFinding += cleanText(rawFinding) + " ";
      fullImpression += cleanText(rawImpression) + " ";
    }

    fullFinding = fullFinding.trim();
    fullImpression = fullImpression.trim();

    if (!fullFinding || !fullImpression) {
      return res.status(400).json({ error: "One or more analysis results are empty. Please check the API response." });
    }

    aiReport.diagnosisReportFinding = fullFinding;
    aiReport.diagnosisReportImpration = fullImpression;

    await aiReport.save();

    res.status(200).json(aiReport);
  } catch (error) {
    console.error("Analyze Error:", error);
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
    res.status(500).json({ error: error.message });
  }
};

// exports.analyzeImage1 = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { imageUrl } = req.body;

//     if (!Array.isArray(imageUrl) || imageUrl.length === 0) {
//       return res.status(400).json({ error: "imageUrl must be a non-empty array of URLs." });
//     }

//     const aiReport = await AIReport.findById(id);
//     if (!aiReport) {
//       return res.status(404).json({ error: "AI Report not found" });
//     }

//     const promptFinding = "Provide only the medical findings from this image without explanations, instructions, or steps and dont say Image Analysis Report and dont say any thing just findings ";
//     const promptImpression = "Provide the diagnostic impression based on the image without explanations, instructions, or steps and dont say Image Analysis Report and dont say any thing just impression";

//     let fullFinding = "";
//     let fullImpression = "";

//     for (const image of imageUrl) {
//       const [findingRes, impressionRes] = await Promise.all([
//         axios.post("https://8b8d-41-33-141-180.ngrok-free.app/analyze-image", {
//           text: promptFinding,
//           image_url: image
//         }, { timeout: 100000 }),

//         axios.post("https://8b8d-41-33-141-180.ngrok-free.app/analyze-image", {
//           text: promptImpression,
//           image_url: image
//         }, { timeout: 100000 }),
//       ]);

//       const rawFinding = findingRes.data?.diagnosis || '';
//       const rawImpression = impressionRes.data?.diagnosis || '';

//       const cleanText = (text) => {
//         return typeof text === 'string'
//           ? text.replace(/(\*\*.*?\*\*|\n|\*|:)/g, "").trim()
//           : '';
//       };

//       fullFinding += cleanText(rawFinding) + " ";
//       fullImpression += cleanText(rawImpression) + " ";
//     }

//     fullFinding = fullFinding.trim();
//     fullImpression = fullImpression.trim();

//     if (!fullFinding || !fullImpression) {
//       return res.status(400).json({ error: "One or more analysis results are empty. Please check the API response." });
//     }

//     aiReport.diagnosisReportFinding = fullFinding;
//     aiReport.diagnosisReportImpration = fullImpression;

//     await aiReport.save();

//     res.status(200).json(aiReport);
//   } catch (error) {
//     console.error("Analyze Error:", error);
//     if (error.response) {
//       console.error("Status:", error.response.status);
//       console.error("Data:", error.response.data);
//     }
//     res.status(500).json({ error: error.message });
//   }
// };


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

exports.getAIReportByStudyInstanceUID = async (req, res) => {
  try {
    const { Study_Instance_UID } = req.params;
    recored = await RadiologyRecord.findOne({ "Study_Instance_UID": Study_Instance_UID });  
    // const aiReport = await AIReport.findOne({ "radiologyRecord.Study_Instance_UID": Study_Instance_UID });
    const aiReport = await AIReport.findOne({ record: recored._id });
    if (!aiReport) {
      return res.status(404).json({ error: "AI Report not found" });
    }

    res.status(200).json(aiReport);
      if (!recored) {
      return res.status(404).json({ error: "AI Report not found" });
    }

    res.status(200).json();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



module.exports = exports;
