const mongoose = require("mongoose");
const CenterRadiologistsRelation = require("../models/CenterRadiologistsRelation.Model");
const RadiologyCenter = require("../models/Radiology_Centers.Model");
const Radiologist = require("../models/Radiologists.Model");
const RadiologyRecord = require("../models/RadiologyRecords.Model");


exports.getRecordsCountForRadiologistInPeriod = async (req, res) => {
  try {
    const { radiologistId} = req.params;

    const { startDate, endDate } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(radiologistId)) {
      return res.status(400).json({
        error: "Invalid ID",
        message: "The provided radiologist ID is not valid",
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: "Missing Parameters",
        message: "Both startDate and endDate are required in query params",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({
        error: "Invalid Date Format",
        message: "startDate or endDate is not a valid date",
      });
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const recordCount = await RadiologyRecord.countDocuments({
      radiologistId,
      createdAt: { $gte: start, $lte: end },
    });

    res.status(200).json({ recordCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getRecordsCountByStudyType = async (req, res) => {
  try {
    const { radiologistId } = req.params;
    const { startDate, endDate } = req.body;

    if (!mongoose.Types.ObjectId.isValid(radiologistId)) {
      return res.status(400).json({
        error: "Invalid ID",
        message: "The provided radiologist ID is not valid",
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: "Missing Parameters",
        message: "Both startDate and endDate are required in query params",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({
        error: "Invalid Date Format",
        message: "startDate or endDate is not a valid date",
      });
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const recordsGroupedByStudyType = await RadiologyRecord.aggregate([
      {
        $match: {
          radiologistId: new mongoose.Types.ObjectId(radiologistId),
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: "$modality",
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json(recordsGroupedByStudyType);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.getNumberOfReports = async (req, res) => {
  try {
    const { radiologistId } = req.params;
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate and endDate are required in query' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const radiologist = await Radiologist.findById(radiologistId);

    if (!radiologist) {
      return res.status(404).json({ message: 'Radiologist not found' });
    }

    const reportsCount = {};
    const { numberOfReports } = radiologist;

    for (const specialization in numberOfReports) {
      if (Array.isArray(numberOfReports[specialization])) {
        const filteredReports = numberOfReports[specialization].filter(date => {
          const reportDate = new Date(date);
          return reportDate >= start && reportDate <= end;
        });
        reportsCount[specialization] = filteredReports.length;
      }
    }

    return res.status(200).json({ reportsCount });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};
exports.getRecordsCountByStatus = async (req, res) => {
  try {
    const { radiologistId } = req.params;
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate and endDate are required in query' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const count = await RadiologyRecord.countDocuments({
      radiologistId: new mongoose.Types.ObjectId(radiologistId),
      createdAt: { $gte: start, $lte: end },
      status: { $in: ["Ready", "Diagnose",  "Completed",] },
    });

    const countByStatus = {};
    const statuses = ["Ready", "Diagnose",  "Completed",];

    for (const status of statuses) {
      countByStatus[status] = await RadiologyRecord.countDocuments({
        radiologistId: new mongoose.Types.ObjectId(radiologistId),
        createdAt: { $gte: start, $lte: end },
        status,
      });
    }

    return res.status(200).json({ count, countByStatus });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

