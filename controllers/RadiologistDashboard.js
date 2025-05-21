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

exports.getAverageTimeToCompleteReport = async (req, res) => {
  try {
    const { radiologistId } = req.params;
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate and endDate are required in query' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const completedRecords = await RadiologyRecord.find({
      radiologistId: new mongoose.Types.ObjectId(radiologistId),
      createdAt: { $gte: start, $lte: end },
      status: "Completed",
    });

    if (completedRecords.length === 0) {
      return res.status(200).json({ averageTime: 0 });
    }

    const totalCompletionTime = completedRecords.reduce((acc, record) => {
      const completionTime = new Date(record.updatedAt) - new Date(record.createdAt);
      return acc + completionTime;
    }, 0);

    const averageTime = totalCompletionTime / completedRecords.length/60/60/60;

    return res.status(200).json({ averageTime });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};
exports.getWeeklyRecordsCountPerDayPerStatus = async (req, res) => {
  try {
    const { radiologistsId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(radiologistsId)) {
      return res.status(400).json({
        error: "Invalid ID",
        message: "The provided radiologists ID is not valid",
      });
    }

    const radiologist = await Radiologist.findById(radiologistsId);
    if (!radiologist) {
      return res.status(404).json({
        error: "Not Found",
        message: "Radiologist not found",
      });
    }

    const today = new Date();

    const jsDay = today.getDay();
    const daysSinceSaturday = (jsDay + 1) % 7;

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - daysSinceSaturday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    endOfWeek.setHours(0, 0, 0, 0);

    const records = await RadiologyRecord.aggregate([
      {
        $match: {
          radiologistId: new mongoose.Types.ObjectId(radiologistsId),
          createdAt: { $gte: startOfWeek, $lt: endOfWeek },
        },
      },
      {
        $project: {
          status: 1,
          createdAt: 1,

          jsDayOfWeek: { $mod: [{ $add: [{ $dayOfWeek: "$createdAt" }, 7] }, 7] }
        },
      },
      {
        $group: {
          _id: { dayOfWeek: "$jsDayOfWeek", status: "$status" },
          count: { $sum: 1 },
        },
      },
    ]);

    const dayNames = [
      "Saturday", 
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
    ];

    const weekData = {};
    for (const dayName of dayNames) {
      weekData[dayName] = {
        Diagnose: 0,
        Completed: 0,
        Ready: 0,
        total: 0,
      };
    }

    for (const record of records) {
      const day = dayNames[record._id.dayOfWeek];
      const status = record._id.status;
      const count = record.count;

      weekData[day][status] += count;
      weekData[day].total += count;
    }

    res.status(200).json({
      message: "retrieved successfully",
      data: weekData,
    });
  } catch (error) {
    console.error("Error in getWeeklyRecordsCountPerDayInCenterPerStatus:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to retrieve data",
    });
  }
};



