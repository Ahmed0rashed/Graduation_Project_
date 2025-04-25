const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const RadiologyRecord = require("../models/RadiologyRecords.Model");
const RadiologyCenter = require("../models/Radiology_Centers.Model");
const AIReport = require("../models/AIReports.Model");
const Radiologist = require("../models/Radiologists.Model");
const CenterRadiologistsRelation = require("../models/CenterRadiologistsRelation.Model");
const notificationManager = require('../middleware/notfi');



const sendNotification = async (userId, userType, title, message,image,centername) => {
  try {
    const result = await notificationManager.sendNotification(
      userId,
      userType,
      title,
      message,
      image,
      centername
    );

    return result;
  } catch (error) {
    console.error("Notification error:", error);
    throw error;
  }
};

async function incrementRecordForToday(centerId) {
  const today = new Date().toISOString().split('T')[0];

  const center = await RadiologyCenter.findById(centerId);
  if (!center) {
    throw new Error("Center not found");
  }


  if (!(center.recordsCountPerDay instanceof Map)) {
    center.recordsCountPerDay = new Map(Object.entries(center.recordsCountPerDay || {}));
  }

  const prev = center.recordsCountPerDay.get(today) || 0;
  center.recordsCountPerDay.set(today, prev + 1);

  await center.save();

  return {
    date: today,
    count: center.recordsCountPerDay.get(today)
  };
}


exports.addRecord = async (req, res) => {
  try {
    const { centerId, patient_name, study_date, patient_id,sex,
            modality, PatientBirthDate, age,study_description,email,
            DicomId, series, body_part_examined, status, Dicom_url, Study_Instance_UID, Series_Instance_UID } = req.body;

    if (!mongoose.Types.ObjectId.isValid(centerId)) {
      return res.status(400).json({ error: "Invalid centerId format" });
    }
    const validCenterId = new mongoose.Types.ObjectId(centerId);

    // const radiologistSpecialty = await axios.post("https://ml-api-7yq4la.fly.dev/predict/", {
    //   modality: modality,  
    //   body_part_examined: body_part_examined,  
    //   description: study_description  
    // }, { timeout: 100000 });

   const radiologistSpecialty = 'Chest Radiology';
    
    console.log("Radiologist API Response:", radiologistSpecialty);
    

    const radiologistsInCenter = await CenterRadiologistsRelation.findOne({ center: validCenterId });
    
    if (!radiologistsInCenter || radiologistsInCenter.radiologists.length === 0) {
      return res.status(404).json({ message: "No radiologists found in center" });
    }
    
    let radiologist = await Radiologist.findOne({
      _id: { $in: radiologistsInCenter.radiologists },
      specialization: radiologistSpecialty
    });
    

    if (!radiologist) {
      radiologist = await Radiologist.findOne({ _id: { $in: radiologistsInCenter.radiologists } });
    }
    
    incrementRecordForToday(validCenterId);

    const record = new RadiologyRecord({
      centerId: validCenterId,
      radiologistId: radiologist._id,
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
      status,
      specializationRequest: radiologistSpecialty,
      Study_Instance_UID,
      Series_Instance_UID,
    });

    const savedRecord = await record.save();

    const aiReport = new AIReport({
      record: savedRecord._id,
      centerId: validCenterId,
      radiologistID: radiologist._id, 
      diagnosisReportFinding: " ",
      diagnosisReportImpration: " ",
      diagnosisReportComment: " ",
      confidenceLevel: 0.0,
      generatedDate: new Date(),
    });

    const center = await RadiologyCenter.findById(validCenterId);
    const notification = await sendNotification(radiologist._id, "Radiologist", center.centerName , "New study assigned to you" ,center.image,center.centerName);

    if (notification.save) {
      await notification.save(); 
    }
    const savedAIReport = await aiReport.save();

    savedRecord.reportId = savedAIReport._id;
    await savedRecord.save();

    res.status(200).json({ record: savedRecord, savedAIReport });
  } catch (error) {
    console.error("Error in addRecord:", error);
    res.status(500).json({ error: error.message || error.toString() || "Unknown error" });
  }
};


exports.updateRecordById = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "Status is missing from request" });

    if (!req.params.id) return res.status(400).json({ error: "Record ID is missing" });

    const updatedRecord = await RadiologyRecord.findByIdAndUpdate(
      req.params.id,
      { status }, 
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
};

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
    const { status, id } = req.params;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }
    // Fetch the record by ID
    const records = await RadiologyRecord.find({ centerId: req.params.id }).sort({ createdAt: -1 });
    if (!records) {
      return res.status(404).json({ error: "Record not found" });
    }
    // Check if `records` has an array of sub-records (modify this based on your schema)
    const filteredRecords = records.filter(r => r.status === status) || [];
    res.status(200).json({
      numOfRadiologyRecords: filteredRecords.length,
      Records: filteredRecords,
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
    // res.status(200).json({
    //   numOfRecords: records.length,
    //   records,
      
    // });
    const recordsWithRadiologistName = await Promise.all(records.map(async (record) => {
      const radiologist = await Radiologist.findById(record.radiologistId);
      return {
        ...record.toObject(),
        radiologistName: radiologist ? `${radiologist.firstName} ${radiologist.lastName}` : "Unknown"
      };
    }));

    res.status(200).json({
      numOfRecords: recordsWithRadiologistName.length,
      records: recordsWithRadiologistName,
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


exports.cancel = async (req, res) => {
  try {
    
    const Record = await RadiologyRecord.findById(req.params.id);

    if (!Record) {
      return res.status(404).json({ message: "Record not found" });
    }
    const radiologistSpecialty = await axios.post("https://ml-api-7yq4la.fly.dev/predict/", {
      modality:Record.modality,  
      body_part_examined: Record.body_part_examined,  
      description: Record.study_description  
    }, { timeout: 100000 });

    // console.log("Radiologist API Response:", radiologistSpecialty.data.Specialty);


    
    const radiologistsInCenter = await CenterRadiologistsRelation.findOne({ center: Record.centerId });

    if (!radiologistsInCenter || radiologistsInCenter.radiologists.length === 0) {
      return res.status(404).json({ message: "No radiologists found in center" });
    }

    const canceledByList = Record.cancledby.map(id => id.toString());
    
    const availableRadiologists = radiologistsInCenter.radiologists.filter(radiologist => !radiologist.equals(Record.radiologistId) &&
    !canceledByList.includes(radiologist.toString()));

    if (availableRadiologists.length === 0) {
      return res.status(404).json({ message: "No alternative radiologists found" });
    }console.log("Available Radiologists:", availableRadiologists);

    
    
    let newRadiologist = await Radiologist.findOne({
      _id: { $in: availableRadiologists },
      specialization: radiologistSpecialty
    });
    console.log("Selected Radiologist:", newRadiologist);
    
    if (!newRadiologist) {
      newRadiologist = await Radiologist.findOne({ _id: { $in: availableRadiologists } });
    }
    console.log("Selected Radiologist2:", newRadiologist);


    if (!newRadiologist) {
      return res.status(404).json({ message: "No suitable radiologist found" });
    }

  
    const record = await RadiologyRecord.findByIdAndUpdate(
      req.params.id, 
      { radiologistId: newRadiologist._id ,
        cancledby: [...Record.cancledby, Record.radiologistId]
      }, 
    
      { new: true }
    );
    const notification = await sendNotification(newRadiologist._id, "Radiologist", "New Study", "New study assigned to you for review");

    if (notification.save) {
      await notification.save(); 
    }

    res.status(200).json({ message: "Radiologist updated successfully", newRadiologist });
  } catch (error) {
    console.error("Error in cancel:", error);
    res.status(500).json({ error: error.message });
  }
};




module.exports = exports;
