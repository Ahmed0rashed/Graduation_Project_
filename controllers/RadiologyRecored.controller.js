const express = require("express");
const mongoose = require("mongoose");
const RadiologyRecord = require("../models/RadiologyRecords.Model");
const RadiologyCenter = require("../models/Radiology_Centers.Model");
const AIReport = require("../models/AIReports.Model");


const router = express.Router();

exports.addRecord = async (req, res) => {
  try {
    const {
      centerId, radiologistId, patient_name, study_date, patient_id, sex, modality,
      PatientBirthDate, age, study_description, email, DicomId, series,
      body_part_examined, status,Dicom_url  
    } = req.body;

    if (!centerId) {
      return res.status(400).json({ error: "centerId is missing from request" });
    }

    const validCenterId = new mongoose.Types.ObjectId(centerId);
    const validRadiologistId = new mongoose.Types.ObjectId(radiologistId);
    
    const record = await RadiologyRecord.create({
      centerId: validCenterId,
      radiologistId: validRadiologistId,
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
      DicomId,
      Dicom_url,
      status
    });
    const savedRecord = await record.save();

    const aiReport = await AIReport.create({
      record: savedRecord._id,
      centerId: validCenterId,
      radiologistID: validRadiologistId,
      diagnosisReportFinding: " ",
      diagnosisReportImpration: " ",
      diagnosisReportComment: " ",
      confidenceLevel: 0.0,
      generatedDate: new Date(),
    });

    const savedAIReport = await aiReport.save();
    res.status(200).json({ record: savedRecord, savedAIReport: savedAIReport });
  } catch (error) {
    console.error("Error in addRecord:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateRecordById = async (req, res) => {
  try {
    const  status  = req.body;
    if (!status) return res.status(400).json({ error: "status is missing from request" });
    const updatedRecord = await RadiologyRecord.findByIdAndUpdate(
      req.params.id,
      status,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!updatedRecord) return res.status(404).json({ error: "Record not found" });
    res.status(200).json({ message: "Record updated successfully", updatedRecord });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
  exports.getAllRecords = async (req, res) => {
    try {
      const Records = await RadiologyRecord.find().sort({ createdAt: -1 });
      if (!Records) return res.status(404).json({ error: "Records not found" });
      res.status(200).json({
        numOfRecords: Records.length,
        Records,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  exports.getOneRecordById = async (req, res) => {
    try {
      const record = await RadiologyRecord.findById(req.params.id);
      if (!record) return res.status(404).json({ error: "Record not found" });
      res.status(200).json(record);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  exports.getAllRecordsByStatus = async (req, res) => {
    try {
      const { status } = req.params;
      if (!status)
        return res.status(400).json({ error: "Status is required" });

      const Records = await RadiologyRecord.find({ status: status }).populate(
        "status"
      );
      res.status(200).json({
        numOfRadiologyRecords: Records.length,
        Records,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // exports.getRecordsByRadiologistId = async (req, res) => {
  //   try {
  //     const records = await RadiologyRecord.find({ radiologistId: req.params.id }).sort({ createdAt: -1 });
  //     if (!records) return res.status(404).json({ error: "Records not found" });
  //     res.status(200).json({
  //       numOfRecords: records.length,
  //       records,
  //     });
  //   } catch (error) {
  //     res.status(500).json({ error: error.message });
  //   }
  // };


  exports.getRecordsByCenterId = async (req, res) => {
    try {
      const records = await RadiologyRecord.find({ centerId: req.params.id }).sort({ createdAt: -1 });
      if (!records) return res.status(404).json({ error: "records not found" });
      res.status(200).json({
        numOfRecords: records.length,
        records,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };


  exports.deleteRecordById = async (req, res) => {
    try {
      const deletedRecord = await RadiologyRecord.findById(req.params.id);
      if (!deletedRecord)
        return res.status(404).json({ message: "Record not found" });
      deletedRecord.deleted = true;
      res.status(200).json({ message: "Record deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
  exports.realDeleteRecordById = async (req, res) => {
    try {
      const deletedRecord = await RadiologyRecord.findByIdAndDelete(req.params.id);
      if (!deletedRecord)
        return res.status(404).json({ message: "Record not found." });
      res.status(200).json({ message: "Record deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };


  // exports.getRecordsByRediologyId = async (req, res) => {
  //   const { id } = req.params;

  //   try {

  //     const records = await RadiologyRecord.find({ radiologistId: id })
  //       .sort({ createdAt: -1 });



//     if (!records.length) {
//       return res.status(404).json({ message: "No records found for this radiologist." });
//     }
//     const recordsWithAIReports = await Promise.all(
//       records.map(async (record) => {
//         const aiReport = await AIReport.findOne({ record: record._id });
//         return {
//           ...record._doc,  
//           aiReportStatus: aiReport ? aiReport.status : "Available",
//           aiReportResult: aiReport ? aiReport.result : "New",
//         };
//       })
//     );
//     res.status(200).json(recordsWithAIReports);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };



//       const recordsWithAIReports = await Promise.all(
//         records.map(async (record) => {
//           const aiReport = await AIReport.findOne({ record: record._id });

//           return {
//             ...record._doc,  
//             aiReportStatus: aiReport ? aiReport.status : "Available",
//             aiReportResult: aiReport ? aiReport.result : "New",
//           };
//         })
//       );

//       res.status(200).json(recordsWithAIReports);
//     } catch (error) {
//       res.status(500).json({ error: error.message });
//     }
//   };

exports.getRecordsByRadiologistId = async (req, res) => {
  const { id } = req.params;
  try {
    
    const records = await RadiologyRecord.find({ radiologistId: id }).sort({ createdAt: -1 });

    
    if (!records.length) {
      return res.status(404).json({ message: "No records found for this radiologist" });
    }

   
    const recordIds = records.map(record => record._id);
    const centerIds = [...new Set(records.map(record => record.centerId.toString()))]; 

    
    const aiReports = await AIReport.find({ record: { $in: recordIds } });

    
    const centers = await RadiologyCenter.find({ _id: { $in: centerIds } });

    
    const aiReportMap = new Map(aiReports.map(report => [report.record.toString(), report]));
    const centerMap = new Map(centers.map(center => [center._id.toString(), center.centerName]));

  
    const recordsWithDetails = records.map(record => ({
      ...record.toObject(),
      aiReportStatus: aiReportMap.get(record._id.toString())?.status || "Available",
      aiReportResult: aiReportMap.get(record._id.toString())?.result || "New",
      centerName: centerMap.get(record.centerId?.toString()) || "Unknown"
    }));

    res.status(200).json(recordsWithDetails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};






  module.exports = exports;
