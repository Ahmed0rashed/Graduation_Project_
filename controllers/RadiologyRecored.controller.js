const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const RadiologyRecord = require("../models/RadiologyRecords.Model");
const RadiologyCenter = require("../models/Radiology_Centers.Model");
const AIReport = require("../models/AIReports.Model");
const Radiologist = require("../models/Radiologists.Model");
const CenterRadiologistsRelation = require("../models/CenterRadiologistsRelation.Model");
const notificationManager = require("../middleware/notfi");
const nodemailer = require("nodemailer");

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

async function incrementRecordForToday(centerId) {
  const today = new Date().toISOString().split("T")[0];

  const center = await RadiologyCenter.findById(centerId);
  if (!center) {
    throw new Error("Center not found");
  }

  if (!(center.recordsCountPerDay instanceof Map)) {
    center.recordsCountPerDay = new Map(
      Object.entries(center.recordsCountPerDay || {})
    );
  }

  const prev = center.recordsCountPerDay.get(today) || 0;
  center.recordsCountPerDay.set(today, prev + 1);

  await center.save();

  return {
    date: today,
    count: center.recordsCountPerDay.get(today),
  };
}

exports.addRecord = async (req, res) => {
  try {
    const {
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
      DicomId,
      series,
      body_part_examined,
      status,
      Dicom_url,
      Study_Instance_UID,
      Series_Instance_UID,
      useOuerRadiologist,
    } = req.body;

    const Center = await RadiologyCenter.findById(centerId);

    if (!Center) {
      return res.status(404).json({ error: "Center not found" });
    }

    let ourcenterId;
    if (useOuerRadiologist === true || useOuerRadiologist === "true") {
      ourcenterId = "6844d679124fb12bbfd7e43d";
    } else {
      ourcenterId = centerId;
    }

    if (!mongoose.Types.ObjectId.isValid(ourcenterId)) {
      return res.status(400).json({ error: "Invalid centerId format" });
    }

    const validCenterId = new mongoose.Types.ObjectId(ourcenterId);

    const radiologistSpecialty = await axios.post(
      "https://ml-api-7yq4la.fly.dev/predict/",
      {
        modality,
        body_part_examined,
        description: study_description,
      },
      { timeout: 100000 }
    );

    const specialty = radiologistSpecialty.data.Specialty;

    const radiologistsInCenter = await CenterRadiologistsRelation.findOne({
      center: validCenterId,
    });

    if (
      !radiologistsInCenter ||
      radiologistsInCenter.radiologists.length === 0
    ) {
      return res
        .status(404)
        .json({ message: "No radiologists found in center" });
    }

    let radiologists1 = await Radiologist.find({
      _id: { $in: radiologistsInCenter.radiologists },
      specialization: specialty,
    });

    const recordsPerRadiologist = await RadiologyRecord.aggregate([
      {
        $match: {
          centerId: validCenterId,
          status: { $in: ["Ready", "Diagnose"] },
          radiologistId: { $in: radiologists1.map((r) => r._id) },
        },
      },
      {
        $group: {
          _id: "$radiologistId",
          count: { $sum: 1 },
        },
      },
    ]);

    const radiologistCountMap = new Map(
      recordsPerRadiologist.map((item) => [item._id.toString(), item.count])
    );

    let radiologist = radiologists1.reduce((min, r) => {
      const count = radiologistCountMap.get(r._id.toString()) || 0;
      if (!min || count < min.count) {
        return { ...r.toObject(), count };
      }
      return min;
    }, null);
    radiologists1.forEach((r) => {
      const count = radiologistCountMap.get(r._id.toString()) || 0;
      // console.log(` Radiologist ${r._id} has ${count} pending/available cases`);
    });

    if (!radiologist || !radiologist._id) {
      radiologist = await Radiologist.findOne({
        _id: { $in: radiologistsInCenter.radiologists },
      });
    }

    if (!radiologist || !radiologist._id) {
      console.error(" Radiologist not found! Can't send notification.");
      return res.status(500).json({ error: "Radiologist assignment failed." });
    }

    console.log("Assigned Radiologist ID:", radiologist._id);

    incrementRecordForToday(validCenterId);

    const record = new RadiologyRecord({
      centerId: centerId,
      centerId_Work_on_Dicom: validCenterId,
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
      deadline: new Date(
        Date.now() + 60 * 60 * Center.firstdeadlineHours * 1000
      ),
      useOuerRadiologist,
      status: "Ready",
      specializationRequest: specialty,
      Study_Instance_UID,
      Series_Instance_UID,
    });

    const savedRecord = await record.save();
    if ( radiologist.status !== "online") {
      await sendEmail2( radiologist.email, Center.centerName, Center.email, savedRecord._id,savedRecord.patient_name, radiologist.firstName + " " + radiologist.lastName, savedRecord.deadline, radiologist._id);
    }
    const aiReport = new AIReport({
      record: savedRecord._id,
      centerId: centerId,
      radiologistID: radiologist._id,
      diagnosisReportFinding: " ",
      diagnosisReportImpration: " ",
      diagnosisReportComment: " ",
      confidenceLevel: 0.0,
      generatedDate: new Date(),
    });

    const center = await RadiologyCenter.findById(validCenterId);

    const notificationResult = await sendNotification(
      radiologist._id,
      "Radiologist",
      center.centerName,
      "New study assigned to you",
      center.image,
      center.centerName,
      "study"
    );

    if (notificationResult && notificationResult.notification) {
      console.log("Notification created successfully");
    }

    const savedAIReport = await aiReport.save();

    savedRecord.reportId = savedAIReport._id;
    await savedRecord.save();

    res.status(200).json({ record: savedRecord, savedAIReport });
  } catch (error) {
    console.error("Error in addRecord:", error);
    res
      .status(500)
      .json({ error: error.message || error.toString() || "Unknown error" });
  }
};

exports.updateRecordById = async (req, res) => {
  try {
    // const { status } = req.body;
    // if (!status) return res.status(400).json({ error: "Status is missing from request" });

    if (!req.params.id)
      return res.status(400).json({ error: "Record ID is missing" });

    const updatedRecord = await RadiologyRecord.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedRecord)
      return res.status(404).json({ error: "Record not found" });

    res
      .status(200)
      .json({ message: "Record updated successfully", updatedRecord });
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
};
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

    const records = await RadiologyRecord.find({
      centerId: req.params.id,
    }).sort({ createdAt: -1 });
    if (!records) {
      return res.status(404).json({ error: "Record not found" });
    }

    const filteredRecords = records.filter((r) => r.status === status) || [];
    res.status(200).json({
      numOfRadiologyRecords: filteredRecords.length,
      Records: filteredRecords,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getRecordsByCenterId = async (req, res) => {
  try {
    const records = await RadiologyRecord.find({
      $or: [
        { centerId: req.params.id },
        { centerId_Work_on_Dicom: req.params.id },
      ],
    }).sort({ createdAt: -1 });
    if (!records) return res.status(404).json({ error: "records not found" });

    const recordsWithRadiologistName = await Promise.all(
      records.map(async (record) => {
        const radiologist = await Radiologist.findById(record.radiologistId);
        return {
          ...record.toObject(),
          radiologistName: radiologist
            ? `${radiologist.firstName} ${radiologist.lastName}`
            : "Unknown",
        };
      })
    );

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
    const deletedRecord = await RadiologyRecord.findByIdAndDelete(
      req.params.id
    );
    if (!deletedRecord)
      return res.status(404).json({ message: "Record not found." });
    res.status(200).json({ message: "Record deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getRecordsByRadiologistId = async (req, res) => {
  const { id } = req.params;
  try {
    const records = await RadiologyRecord.find({ radiologistId: id }).sort({
      createdAt: -1,
    });

    if (!records) {
      return res
        .status(404)
        .json({ message: "No records found " });
    }

    if (!records.length) {
      return res
        .status(200)
        .json({ message: "No records found for you" });
    }

    const recordIds = records.map((record) => record._id);
    const centerIds = [
      ...new Set(records.map((record) => record.centerId.toString())),
    ];

    const aiReports = await AIReport.find({ record: { $in: recordIds } });

    const centers = await RadiologyCenter.find({ _id: { $in: centerIds } });

    const aiReportMap = new Map(
      aiReports.map((report) => [report.record.toString(), report])
    );
    const centerMap = new Map(
      centers.map((center) => [center._id.toString(), center.centerName])
    );

    const recordsWithDetails = records.map((record) => ({
      ...record.toObject(),
      aiReportStatus:
        aiReportMap.get(record._id.toString())?.status || "Available",
      aiReportResult: aiReportMap.get(record._id.toString())?.result || "New",
      centerName: centerMap.get(record.centerId?.toString()) || "Unknown",
    }));

    res.status(200).json(recordsWithDetails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.toggleFlag = async (req, res) => {
  try {
    const record = await RadiologyRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ message: "Record not found" });
    }

    const center = await RadiologyCenter.findById(record.centerId);
    const currentRadiologist = await Radiologist.findById(record.radiologistId);

    const { comment, flag } = req.body;
    if (!flag) {
      return res.status(400).json({ message: "flag is required" });
    }

    if (!Array.isArray(record.dicom_Comment)) {
      record.dicom_Comment = [];
    }

    if (flag === true || flag === "true") {
      record.flag = true;
    }

    if (flag === false || flag === "false") {
      record.flag = false;
    }

    await record.save();

    record.dicom_Comment.push(comment);

    if (flag === true || flag === "true") {
      const validCenterId = new mongoose.Types.ObjectId(center._id);
      const specialty = record.specializationRequest;

      const radiologistsInCenter = await CenterRadiologistsRelation.findOne({
        center: validCenterId,
      });

      if (
        !radiologistsInCenter ||
        radiologistsInCenter.radiologists.length === 0
      ) {
        return res
          .status(404)
          .json({ message: "No radiologists found in center" });
      }

      let radiologists1 = await Radiologist.find({
        _id: { $in: radiologistsInCenter.radiologists },
        specialization: specialty,
      });

      if (!radiologists1 || radiologists1.length === 0) {
        radiologists1 = await Radiologist.find({
          _id: { $in: radiologistsInCenter.radiologists },
        });

        if (!radiologists1 || radiologists1.length === 0) {
          return res.status(404).json({
            message: "No radiologists available in the center",
          });
        }
      }

      const recordsPerRadiologist = await RadiologyRecord.aggregate([
        {
          $match: {
            centerId: validCenterId,
            status: { $in: ["Ready", "Diagnose"] },
            radiologistId: { $in: radiologists1.map((r) => r._id) },
          },
        },
        {
          $group: {
            _id: "$radiologistId",
            count: { $sum: 1 },
          },
        },
      ]);

      const radiologistCountMap = new Map(
        recordsPerRadiologist.map((item) => [item._id.toString(), item.count])
      );

      let selectedRadiologist = radiologists1.reduce((min, r) => {
        const count = radiologistCountMap.get(r._id.toString()) || 0;
        if (!min || count < min.count) {
          return { ...r.toObject(), count };
        }
        return min;
      }, null);

      if (!selectedRadiologist || !selectedRadiologist._id) {
        console.error("Radiologist assignment failed");
        return res
          .status(500)
          .json({ error: "Radiologist assignment failed." });
      }

      console.log("Assigned Radiologist ID:", selectedRadiologist._id);

      record.radiologistId = selectedRadiologist._id;

      incrementRecordForToday(validCenterId);
    }

    record.deadline = new Date(
      Date.now() + 60 * 60 * center.firstEmergancyDeadlineHours * 1000
    );
    const newRadiologist = await Radiologist.findById(record.radiologistId);
                await sendEmergencyEmailToDoctor(
        newRadiologist.email,
        center.centerName,
        center.email,
        record._id,
        record.patient_name,
        newRadiologist.firstName + " " + newRadiologist.lastName,
        record.deadline,
        newRadiologist._id,
        center.emergancydeadlineHours
      );
    record.status = "Ready";
    await record.save();

    const notification = await sendNotification(
      currentRadiologist._id,
      "Radiologist",
      center.centerName,
      "emergency study assigned to you",
      center.image,
      center.centerName
    );


   

    res.status(200).json({
      message: "Flag toggled successfully",
      flagged: record.flag,
    });
  } catch (error) {
    console.error("Error in toggleFlag:", error);
    res.status(500).json({ error: error.message });
  }
};


exports.cancel = async (req, res) => {
  try {
    const Record = await RadiologyRecord.findById(req.params.id);
    const RadiologistId = req.params.radiologistId;
    if (!Record) {
      return res.status(404).json({ message: "Record not found" });
    }

 console.log("RadiologistId:", RadiologistId);
    if (RadiologistId == Record.radiologistId || !RadiologistId) {
      if (Record.status === "Cancled") {
        return res
          .status(400)
          .json({ message: "This record has already been canceled" });
      }

    }else{
      return res
        .status(403)
        .json({ message: "You are not authorized to cancel this record" });
    }

    const specialtyResponse = await axios.post(
      "https://ml-api-7yq4la.fly.dev/predict/",
      {
        modality: Record.modality,
        body_part_examined: Record.body_part_examined,
        description: Record.study_description,
      },
      { timeout: 100000 }
    );

    const predictedSpecialty = specialtyResponse.data.Specialty;

    const radiologistsInCenter = await CenterRadiologistsRelation.findOne({
      center: Record.centerId,
    });
    const center = await RadiologyCenter.findById(Record.centerId);

    if (
      !radiologistsInCenter ||
      radiologistsInCenter.radiologists.length === 0
    ) {
      return res
        .status(404)
        .json({ message: "No radiologists found in center" });
    }

    const canceledByList = Record.cancledby.map((id) => id.toString());

    const availableRadiologists = radiologistsInCenter.radiologists.filter(
      (radiologist) =>
        !radiologist.equals(Record.radiologistId) &&
        !canceledByList.includes(radiologist.toString())
    );
    let newRadiologist = await Radiologist.findOne({
      _id: { $in: availableRadiologists },
      specialization: predictedSpecialty,
    });

    if (availableRadiologists.length === 0) {
      const prevRadiologistId = Record.radiologistId;

      Record.status = "Cancled";
      Record.cancledby.push(prevRadiologistId);
      Record.radiologistId = null;

      await Record.save();

      const notificationResult = await sendNotification(
        center._id,
        "ٌRadiologyCenter",
        "you have a study cancelled",
        "\ncancelled by all radiologists",
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ_J_xJvdD8hmGay4prO6qildXton3MBK8Xi1JYdzifvo2C35Q9SQJBATZKUmIc1CdPzO4&usqp=CAU",
        center.centerName,
        "study"
      );

      if (notificationResult?.save) {
        await notificationResult.save();
      }

      return res
        .status(200)
        .json({ message: "the study has been back to center" });
    }

    // console.log("Available Radiologists:", availableRadiologists);

    // console.log("Selected Radiologist:", newRadiologist);

    if (!newRadiologist) {
      newRadiologist = await Radiologist.findOne({
        _id: { $in: availableRadiologists },
      });
    }

    // console.log("Selected Radiologist2:", newRadiologist);

    if (!newRadiologist) {
      const prevRadiologistId = Record.radiologistId;

      Record.status = "Cancled";
      Record.cancledby.push(prevRadiologistId);
      Record.radiologistId = null;
      Record.emailDeadlinePassedSent = false;
      Record.emailDeadlineSent = false;
      await Record.save();

      const notificationResult = await sendNotification(
        center._id,
        "ٌRadiologyCenter",
        "you have a study cancelled",
        "\ncancelled by all radiologists",
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ_J_xJvdD8hmGay4prO6qildXton3MBK8Xi1JYdzifvo2C35Q9SQJBATZKUmIc1CdPzO4&usqp=CAU",
        center.centerName,
        "study"
      );

      if (notificationResult?.save) {
        await notificationResult.save();
      }

      return res
        .status(200)
        .json({ message: "the study has been back to center" });
    }

    const updatedRecord = await RadiologyRecord.findByIdAndUpdate(
      req.params.id,
      {
        radiologistId: newRadiologist._id,
        cancledby: [...Record.cancledby, Record.radiologistId],
      },
      { new: true }
    );
        if (!Record.flag) {
    Record.deadline = new Date(
      Record.createdAt.getTime() + 60 * 60 * center.deadlineHours * 1000
    );}
    else {
      Record.deadline = new Date(
        Record.createdAt.getTime() + 60 * 60 * center.emergancydeadlineHours * 1000
      );
                  await sendEmergencyEmailToDoctor(
        newRadiologist.email,
        center.centerName,
        center.email,
        updatedRecord._id,
        updatedRecord.patient_name,
        newRadiologist.firstName + " " + newRadiologist.lastName,
        updatedRecord.deadline,
        newRadiologist._id,
        center.emergancydeadlineHours
      );
    }
    

const lastCanceledBy = updatedRecord.cancledby[updatedRecord.cancledby.length - 1];
const RadiologistName = await Radiologist.findById(lastCanceledBy);

    // console.log("RadiologistName:", RadiologistName.firstName,);
    const notification = await sendNotification(
      newRadiologist._id,
      "Radiologist",
      center.centerName,
      "New study assigned to you  \ncancelled by " +
        RadiologistName.firstName +
        " " +
        RadiologistName.lastName,
      center.image,
      center.centerName
    );
    const notificationResult = await sendNotification(
      center._id,
      "RadiologyCenter",
      "Redirecting study",
      "New study assigned to " +
        newRadiologist.firstName +
        " " +
        newRadiologist.lastName +
        " \ncancelled by " +
        RadiologistName.firstName +
        " " +
        RadiologistName.lastName,
      newRadiologist.image,
      center.centerName,
      "study"
    );
    if (notification.save) {
      await notification.save();
    }
    if (notificationResult.save) {
      await notificationResult.save();
    }
        if ( newRadiologist.status !== "online") {
      await sendEmail2( newRadiologist.email, center.centerName, center.email, updatedRecord._id,updatedRecord.patient_name, newRadiologist.firstName + " " + newRadiologist.lastName, updatedRecord.deadline, newRadiologist._id);
    }

    res.status(200).json({
      message: "Radiologist updated successfully",
      newRadiologist,
    });
  } catch (error) {
    console.error("Error in cancel:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.cancelRecordByCron = async (recordId) => {
  try {
    const Record = await RadiologyRecord.findById(recordId);
    if (!Record || Record.status === "Cancled") return;

    const specialtyResponse = await axios.post(
      "https://ml-api-7yq4la.fly.dev/predict/",
      {
        modality: Record.modality,
        body_part_examined: Record.body_part_examined,
        description: Record.study_description,
      },
      { timeout: 100000 }
    );

    const predictedSpecialty = specialtyResponse.data.Specialty;

    const radiologistsInCenter = await CenterRadiologistsRelation.findOne({
      center: Record.centerId,
    });

    const center = await RadiologyCenter.findById(Record.centerId);
    if (!radiologistsInCenter || radiologistsInCenter.radiologists.length === 0)
      return;

    const canceledByList = Record.cancledby.map((id) => id.toString());

    const availableRadiologists = radiologistsInCenter.radiologists.filter(
      (radiologist) =>
        !radiologist.equals(Record.radiologistId) &&
        !canceledByList.includes(radiologist.toString())
    );

    let newRadiologist = await Radiologist.findOne({
      _id: { $in: availableRadiologists },
      specialization: predictedSpecialty,
    });

    if (!newRadiologist) {
      newRadiologist = await Radiologist.findOne({
        _id: { $in: availableRadiologists },
      });
    }

    if (!newRadiologist) {
      const prevRadiologistId = Record.radiologistId;
      Record.status = "Cancled";
      Record.cancledby.push(prevRadiologistId);
      Record.radiologistId = null;
      Record.emailDeadlinePassedSent = false;
      Record.emailDeadlineSent = false;
      await Record.save();

      const notificationResult = await sendNotification(
        center._id,
        "RadiologyCenter",
        "you have a study cancelled",
        "\ncancelled by all radiologists",
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ_J_xJvdD8hmGay4prO6qildXton3MBK8Xi1JYdzifvo2C35Q9SQJBATZKUmIc1CdPzO4&usqp=CAU",
        center.centerName,
        "study"
      );

      if (notificationResult?.save) await notificationResult.save();
      return;
    }

    const updatedRecord = await RadiologyRecord.findByIdAndUpdate(
      recordId,
      {
        radiologistId: newRadiologist._id,
        cancledby: [...Record.cancledby, Record.radiologistId],
      },
      { new: true }
    );
        if (Record.flag) {
    Record.deadline = new Date(
      Record.createdAt.getTime() + 60 * 60 * center.deadlineHours * 1000
    );}
    else {
      Record.deadline = new Date(
        Record.createdAt.getTime() + 60 * 60 * center.emergancydeadlineHours * 1000
      );
            await sendEmergencyEmailToDoctor(
        newRadiologist.email,
        center.centerName,
        center.email,
        updatedRecord._id,
        updatedRecord.patient_name,
        newRadiologist.firstName + " " + newRadiologist.lastName,
        updatedRecord.deadline,
        newRadiologist._id,
        center.emergancydeadlineHours
      );
    }
    const lastCanceledBy = updatedRecord.cancledby[updatedRecord.cancledby.length - 1];
    const prevRadiologist = await Radiologist.findById(lastCanceledBy);

    const notification = await sendNotification(
      newRadiologist._id,
      "Radiologist",
      center.centerName,
      "New study assigned to you  \ncancelled by " +
        prevRadiologist.firstName +
        " " +
        prevRadiologist.lastName,
      center.image,
      center.centerName
    );

    const notificationResult = await sendNotification(
      center._id,
      "ٌRadiologyCenter",
      "Redirecting study",
      "New study assigned to " +
        newRadiologist.firstName +
        " " +
        newRadiologist.lastName +
        " \ncancelled by " +
        prevRadiologist.firstName +
        " " +
        prevRadiologist.lastName,
      newRadiologist.image,
      center.centerName,
      "study"
    );

    if (notification?.save) await notification.save();
    if (notificationResult?.save) await notificationResult.save();

    if (newRadiologist.status !== "online") {
      await sendEmail2(
        newRadiologist.email,
        center.centerName,
        center.email,
        updatedRecord._id,
        updatedRecord.patient_name,
        newRadiologist.firstName + " " + newRadiologist.lastName,
        updatedRecord.deadline,
        newRadiologist._id
      );
    }
  } catch (error) {
    console.error("Error in cancelRecordByCron:", error.message);
  }
};


exports.redirectToOurRadiologist = async (req, res) => {
  try {
    const { recordId } = req.params;
    const ourCenterId = "6844d679124fb12bbfd7e43d";

    if (!recordId) {
      return res.status(400).json({ error: "recordId is required" });
    }

    const record = await RadiologyRecord.findById(recordId);
    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }

    const prediction = await axios.post(
      "https://ml-api-7yq4la.fly.dev/predict/",
      {
        modality: record.modality,
        body_part_examined: record.body_part_examined,
        description: record.study_description,
      },
      { timeout: 200000 }
    );

    const specialty = prediction.data.Specialty;

    const relation = await CenterRadiologistsRelation.findOne({
      center: ourCenterId,
    });

    if (!relation || relation.radiologists.length === 0) {
      return res.status(404).json({ error: "No radiologists in our center" });
    }

    let radiologists = await Radiologist.find({
      _id: { $in: relation.radiologists },
      specialization: specialty,
    });

    const recordsPerRadiologist = await RadiologyRecord.aggregate([
      {
        $match: {
          centerId: new mongoose.Types.ObjectId(ourCenterId),
          status: { $in: ["Ready", "Diagnose"] },
          radiologistId: { $in: radiologists.map((r) => r._id) },
        },
      },
      {
        $group: {
          _id: "$radiologistId",
          count: { $sum: 1 },
        },
      },
    ]);

    const countMap = new Map(
      recordsPerRadiologist.map((r) => [r._id.toString(), r.count])
    );
    let selected = radiologists.reduce((min, r) => {
      const count = countMap.get(r._id.toString()) || 0;
      if (!min || count < min.count) return { ...r.toObject(), count };
      return min;
    }, null);

    if (!selected) {
      selected = await Radiologist.findOne({
        _id: { $in: relation.radiologists },
      });
    }

    if (!selected || !selected._id) {
      return res.status(500).json({ error: "No available radiologist found" });
    }

    record.radiologistId = selected._id;
    record.useOuerRadiologist = true;
    record.specializationRequest = specialty;
    record.status = "Ready";
    record.centerId_Work_on_Dicom = ourCenterId;
    await record.save();

    const ourCenter = await RadiologyCenter.findById(ourCenterId);
    await sendNotification(
      selected._id,
      "Radiologist",
      ourCenter.centerName,
      "New study redirected to you",
      ourCenter.image,
      ourCenter.centerName,
      "study"
    );

    res.status(200).json({ message: "Record redirected successfully", record });
  } catch (error) {
    console.error("Error in redirectToOurRadiologist:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};
const formatDeadlineToEgyptTime = (deadline) => {
  const date = new Date(deadline);
  const options = {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };
  return new Intl.DateTimeFormat("en-GB", options).format(date);
};
const sendEmergencyEmailToDoctor = async (
  email,
  centerName,
  centerEmail,
  recordId,
  patient_name,
  RadiologistName,
  deadline,
  RadiologistId,
  emergencyDeadlineHours
) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "radintelio@gmail.com",
      pass: "iond hchz zpzm bssn", // تأكد من أن ده App Password
    },
  });

  const formattedDeadline = formatDeadlineToEgyptTime(deadline);

  const approveUrl = `https://abanoubsamaan5.github.io/my-react-app/#/approved-report/${recordId}`;
  const cancelUrl = `https://abanoubsamaan5.github.io/my-react-app/#/cancel-report/${recordId}/${RadiologistId}`;

  const mailOptions = {
    from: "radintelio@gmail.com",
    to: email,
    subject: "🚨 Emergency Case Assigned - Immediate Action Required",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 25px; border: 1px solid #ddd; border-radius: 10px; max-width: 650px; margin: auto; background-color: #fffbe6;">
        <div style="text-align: center; margin-bottom: 25px;">
          <img src="https://cdn.dribbble.com/userupload/15606497/file/original-1d7be0867731a998337730f39268a54a.png?format=webp&resize=400x300&vertical=center" alt="Company Logo" style="max-width: 160px;">
        </div>
        <h2 style="color: #d9534f; text-align: center; margin-bottom: 20px;">🚨 Emergency Case Assigned</h2>
        <p style="font-size: 16px; color: #333;">Dear Dr. <strong>${RadiologistName}</strong>,</p>
        <p style="font-size: 16px; color: #333;">
          A new <strong>emergency case</strong> has been assigned to you for patient <strong>${patient_name}</strong> from <strong>${centerName}</strong>.
        </p>
        <p style="font-size: 16px; color: #333;">
          Please prioritize this case and take action <strong>within ${emergencyDeadlineHours} hours</strong> from assignment.
        </p>
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #ffeeba; text-align: center;">
          <strong style="font-size: 18px; color: #856404;">Emergency Deadline: ${formattedDeadline} (Egypt Time)</strong>
        </div>
        <p style="font-size: 16px; color: #333;">
          <strong>Center Details:</strong><br>
          Name: ${centerName}<br>
          Email: <a href="mailto:${centerEmail}" style="color: #337ab7;">${centerEmail}</a><br>
          Study Record ID: <strong>${recordId}</strong>
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${approveUrl}" style="background-color: #28a745; color: white; padding: 12px 25px; text-decoration: none; font-weight: bold; border-radius: 5px; margin-right: 15px; display: inline-block;">
            Approve
          </a>
          <a href="${cancelUrl}" style="background-color: #dc3545; color: white; padding: 12px 25px; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block;">
            Cancel
          </a>
        </div>

        <p style="font-size: 16px; color: #333;">
          Your immediate attention to this emergency case is highly appreciated.
        </p>
        <p style="font-size: 16px; color: #333; margin-top: 30px;">
          Regards,<br><br>
          <strong>Radintel Emergency Team</strong>
        </p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};


const sendEmail2 = async (
  email,
  centerName,
  centerEmail,
  recordId,
  patient_name,
  RadiologistName,
  deadline,
  RadiologistId
) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "radintelio@gmail.com",
      pass: "iond hchz zpzm bssn",
    },
  });

  const formattedDeadline = formatDeadlineToEgyptTime(deadline);

  const approveUrl = `https://abanoubsamaan5.github.io/my-react-app/#/approved-report/${recordId}`;
  const cancelUrl = `https://abanoubsamaan5.github.io/my-react-app/#/cancel-report/${recordId}/${RadiologistId}`;

  const mailOptions = {
    from: "radintelio@gmail.com",
    to: email,
    subject: "New Study Assigned - Action Required (Doctor Offline)",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 25px; border: 1px solid #ddd; border-radius: 10px; max-width: 650px; margin: auto; background-color: #f9f9f9;">
        <div style="text-align: center; margin-bottom: 25px;">
          <img src="https://cdn.dribbble.com/userupload/15606497/file/original-1d7be0867731a998337730f39268a54a.png?format=webp&resize=400x300&vertical=center" alt="Company Logo" style="max-width: 160px;">
        </div>
        <h2 style="color: #c9302c; text-align: center; margin-bottom: 20px;">Urgent: New Study Assigned</h2>
        <p style="font-size: 16px; color: #333;">Dear Dr. <strong>${RadiologistName}</strong>,</p>
        <p style="font-size: 16px; color: #333;">
          You have been assigned a new study for patient <strong>${patient_name}</strong> at <strong>${centerName}</strong>.
        </p>
        <p style="font-size: 16px; color: #333;">
          Our system detected that you are currently offline. It is important to review this study and complete any necessary procedures before the deadline.
        </p>
        <div style="background-color: #ffe6e6; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #ff9999; text-align: center;">
          <strong style="font-size: 18px; color: #d9534f;">Deadline to complete study: ${formattedDeadline} (Egypt Time)</strong>
        </div>
        <p style="font-size: 16px; color: #333;">
          <strong>Center Details:</strong><br>
          Name: ${centerName}<br>
          Email: <a href="mailto:${centerEmail}" style="color: #337ab7;">${centerEmail}</a><br>
          Study Record ID: <strong>${recordId}</strong>
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${approveUrl}" style="background-color: #28a745; color: white; padding: 12px 25px; text-decoration: none; font-weight: bold; border-radius: 5px; margin-right: 15px; display: inline-block;">
            Approve
          </a>
          <a href="${cancelUrl}" style="background-color: #dc3545; color: white; padding: 12px 25px; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block;">
            Cancel
          </a>
        </div>

        <p style="font-size: 16px; color: #333;">
          Please take prompt action to avoid any delays. If you require assistance or an extension, contact the center immediately.
        </p>
        <p style="font-size: 16px; color: #333; margin-top: 30px;">
          Thank you for your attention.<br><br>
          <strong>The Monitoring Team</strong>
        </p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

const sendEmail = async (
  email,
  centerName,
  centerEmail,
  recordId,
  patient_name,
  RadiologistName
) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "radintelio@gmail.com",
      pass: "iond hchz zpzm bssn",
    },
  });

  const mailOptions = {
    from: "radintelio@gmail.com",
    to: email,
    subject: "Warning: Less Than One Hour Left Before Study Ends",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 600px; margin: auto;">
        <div style="text-align: center;">
          <img src="https://cdn.dribbble.com/userupload/15606497/file/original-1d7be0867731a998337730f39268a54a.png?format=webp&resize=400x300&vertical=center" alt="Company Logo" style="max-width: 150px; margin-bottom: 20px;">
        </div>
        <h2 style="color: #d9534f; text-align: center;">Urgent Notice</h2>
        <p style="font-size: 16px; color: #555;">Dear ${RadiologistName},</p>
        <p style="font-size: 16px; color: #555;">
          This is a reminder that there is less than <strong>one hour</strong> remaining before the end of the study for patient <strong>${patient_name}</strong> at center <strong>${centerName}</strong>.
        </p>
        <p style="font-size: 16px; color: #555;">
          Please ensure any required procedures or data collection are completed in time. If you need assistance or an extension, contact the center as soon as possible.
        </p>
        <p style="font-size: 16px; color: #555;">
          Center Details:<br>
          Email: <a href="mailto:${centerEmail}">${centerEmail}</a><br>
          Study Record ID: <strong>${recordId}</strong>
        </p>
        <p style="font-size: 16px; color: #555;">Thank you for your attention.<br><strong>The Monitoring Team</strong></p>
      </div>
    `,
  };
  return transporter.sendMail(mailOptions);
};

exports.sendEmailToRadiologist = async (req, res) => {
  try {
    const { recoredId } = req.params;

    if (!recoredId) {
      return res.status(400).json({ error: "recoredId is required" });
    }
    const record = await RadiologyRecord.findById(recoredId);
    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }
    const center = await RadiologyCenter.findById(record.centerId);
    if (!center) {
      return res.status(404).json({ error: "Center not found" });
    }
    const radiologist = await Radiologist.findById(record.radiologistId);
    if (!radiologist) {
      return res.status(404).json({ error: "Radiologist not found" });
    }

    const result = await sendEmail(
      radiologist.email,
      center.centerName,
      center.email,
      recoredId,
      record.patient_name,
      radiologist.firstName + " " + radiologist.lastName
    );
    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
};
exports.extendStudyDeadline = async (req, res) => {
  try {
    const { recordId } = req.params;
    if (!recordId) {
      return res.status(400).json({ error: "recordId is required" });
    }
    const record = await RadiologyRecord.findById(recordId);
    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }
    const newDeadline = new Date(record.deadline);
    newDeadline.setHours(newDeadline.getHours() + 1);
    record.deadline = newDeadline;
    await record.save();
    res
      .status(200)
      .json({ message: "Study deadline extended by 1 hour", record });
  } catch (error) {
    console.error("Error extending study deadline:", error);
    res.status(500).json({ error: "Failed to extend study deadline" });
  }
};

exports.Approve = async (req, res) => {
  try {
    const { recordId } = req.params;
    if (!recordId) {
      return res.status(400).json({ error: "recordId is required" });
    }
    const record = await RadiologyRecord.findById(recordId);
    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }
    if (record.isApproved === true) {
      return res.status(400).json({ error: "the study is already approved" });
    }
    const center = await RadiologyCenter.findById(record.centerId);
    record.isApproved = true;
    record.status = "Diagnose";
    record.diagnoseAt = new Date();
    record.emailDeadlinePassedSent = false;
    record.emailDeadlineSent = false;
    if (!record.flag) {
    record.deadline = new Date(
      record.createdAt.getTime() + 60 * 60 * center.deadlineHours * 1000
    );}
    else {
      record.deadline = new Date(
        record.createdAt.getTime() + 60 * 60 * center.emergancydeadlineHours * 1000
      );
    }
    await record.save();
    res.status(200).json({ message: "the study is approved", record });
  } catch (error) {
    console.error("Error changing study deadline:", error);
    res.status(500).json({ error: "failed to approve study" });
  }
};
exports.addPhoneNumberToRecord = async (req, res) => {
  try {
    const { recordId } = req.params;
    const { phoneNumber } = req.body;
    if (!recordId || !phoneNumber) {
      return res
        .status(400)
        .json({ error: "recordId and phoneNumber are required" });
    }
    const record = await RadiologyRecord.findById(recordId);
    if (!record) {
      return res.status(404).json({ error: "Record not found" });
    }
    record.phoneNumber = phoneNumber;
    await record.save();
    res.status(200).json({ message: "Phone number added to record", record });
  } catch (error) {
    console.error("Error adding phone number to record:", error);
    res.status(500).json({ error: "Failed to add phone number to record" });
  }
};
module.exports = exports;
