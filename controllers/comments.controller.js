const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const RadiologyRecord = require("../models/RadiologyRecords.Model");
const RadiologyCenter = require("../models/Radiology_Centers.Model");
const AIReport = require("../models/AIReports.Model");
const Radiologist = require("../models/Radiologists.Model");
const CenterRadiologistsRelation = require("../models/CenterRadiologistsRelation.Model");
const notificationManager = require("../middleware/notfi");
const Comment = require("../models/comment.model");

const sendNotification = async (
  userId,
  userType,
  title,
  message,
  image,
  centername,
  type
) => {
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
exports.addcommmet = async (req, res) => {
  try {
    const { recordId, userType, Comments } = req.body;

    if (!recordId || !userType || !Comments) {
      return res
        .status(400)
        .json({ message: "recordId, userType, and Comments are required" });
    }

    const radiologyRecord = await RadiologyRecord.findById(recordId);
    if (!radiologyRecord) {
      return res.status(404).json({ message: "Record not found" });
    }

    let Name, Image, userId;

    if (userType === "Radiologist") {
      const radiologistId = radiologyRecord.radiologistId;
      if (!radiologistId) {
        return res
          .status(404)
          .json({ message: "Radiologist ID not found in record" });
      }

      const radiologist = await Radiologist.findById(radiologistId);
      if (!radiologist) {
        return res.status(404).json({ message: "Radiologist not found" });
      }

      Name = `${radiologist.firstName} ${radiologist.lastName}`;
      Image = radiologist.image;
      userId = radiologistId;
    } else {
      const centerId = radiologyRecord.centerId;
      if (!centerId) {
        return res
          .status(404)
          .json({ message: "Center ID not found in record" });
      }

      const center = await RadiologyCenter.findById(centerId);
      if (!center) {
        return res.status(404).json({ message: "Center not found" });
      }

      Name = center.centerName;
      Image = center.image;
      userId = centerId;
      const notificationResult = await sendNotification(
        radiologyRecord.radiologistId,
        "Radiologist",
        center.centerName,
        "New comment on your record",
        center.image,
        center.centerName,
        "study"
      );
     
    }

    
    const newComment = new Comment({
      name: Name,
      recordId: recordId,
      image: Image,
      userType: userType,
      userId: userId,
      dicom_Comment: [Comments], 
    });

    await newComment.save();

    res
      .status(200)
      .json({ message: "Comment added successfully", comment: newComment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllCommentsByRecordId = async (req, res) => {
  try {
    const { recordId } = req.params;
    if (!recordId) {
      return res.status(400).json({ message: "Record ID is required" });
    }

    const comments = await Comment.find({ recordId }).sort({ createdAt: -1 });
    if (!comments.length) {
      return res
        .status(404)
        .json({ message: "No comments found for this record" });
    }
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
module.exports = exports;
