const mongoose = require("mongoose");
const CenterRadiologistsRelation = require("../models/CenterRadiologistsRelation.Model");
const RadiologyCenter = require("../models/Radiology_Centers.Model");
const Radiologist = require("../models/Radiologists.Model");
const RadiologyRecord = require("../models/RadiologyRecords.Model");
const Radiology_CentersModel = require("../models/Radiology_Centers.Model");


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
      diagnoseAt: { $exists: true }  
    });
    

    if (completedRecords.length === 0) {
      return res.status(200).json({ averageTimeInMinutes: 0 });
    }
   

    const totalCompletionTime = completedRecords.reduce((acc, record) => {
      const diagnoseTime = new Date(record.diagnoseAt);
      console.log("Diagnose Time:", diagnoseTime);
      const completedTime = new Date(record.updatedAt);
      console.log("Completed Time:", completedTime);
      const duration = completedTime - diagnoseTime;
      return acc + duration;
    }, 0);
   

    const averageTimeInMinutes = totalCompletionTime / completedRecords.length / 1000 / 60;

    return res.status(200).json({ averageTimeInMinutes });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getWeeklyRecordsCountPerDayPerStatus = async (req, res) => {
  try {
    const { radiologistsId } = req.params;
    const { startDate, endDate } = req.body;

    if (!mongoose.Types.ObjectId.isValid(radiologistsId)) {
      return res.status(400).json({
        error: "Invalid ID",
        message: "The provided radiologists ID is not valid",
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: "Missing Dates",
        message: "Start date and end date are required",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include full end day

    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({
        error: "Invalid Date Format",
        message: "Please provide valid ISO date strings for startDate and endDate",
      });
    }

    const radiologist = await Radiologist.findById(radiologistsId);
    if (!radiologist) {
      return res.status(404).json({
        error: "Not Found",
        message: "Radiologist not found",
      });
    }

    const records = await RadiologyRecord.aggregate([
      {
        $match: {
          radiologistId: new mongoose.Types.ObjectId(radiologistsId),
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $project: {
          status: 1,
          createdAt: 1,
          jsDayOfWeek: {
            $mod: [
              { $add: [{ $dayOfWeek: "$createdAt" }, 7] },
              7
            ]
          },
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

      if (weekData[day][status] !== undefined) {
        weekData[day][status] += count;
      } else {
        weekData[day][status] = count;
      }

      weekData[day].total += count;
    }

    res.status(200).json({
      message: "retrieved successfully",
      data: weekData,
    });
  } catch (error) {
    console.error("Error in getWeeklyRecordsCountPerDayPerStatus:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to retrieve data",
    });
  }
};


exports.getRecordsCountByCenterForRadiologistInPeriod = async (req, res) => {
  try {
    const { radiologistsId } = req.params;
    const { startDate, endDate } = req.body;

    if (!mongoose.Types.ObjectId.isValid(radiologistsId)) {
      return res.status(400).json({
        error: "Invalid ID",
        message: "The provided radiologist ID is not valid",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start) || isNaN(end) || start >= end) {
      return res.status(400).json({
        error: "Invalid Date Range",
        message: "Start and end dates must be valid and start must be before end",
      });
    }

    const records = await RadiologyRecord.aggregate([
      {
        $match: {
          radiologistId: new mongoose.Types.ObjectId(radiologistsId),
          createdAt: { $gte: start, $lt: end },
        },
      },
      {
        $group: {
          _id: "$centerId",
          completedCount: {
            $sum: {
              $cond: [{ $eq: ["$status", "Completed"] }, 1, 0],
            },
          },
          notCompletedCount: {
            $sum: {
              $cond: [{ $in: ["$status", ["Diagnose", "Ready"]] }, 1, 0],
            },
          },
        },
      },
    ]);

    const centerIds = records.map(r => r._id);
    const centers = await RadiologyCenter.find({ _id: { $in: centerIds } });

    const centersWithCounts = centers.map((center) => {
      const record = records.find(r => r._id.toString() === center._id.toString());

      return {
        centerName: center.centerName,
        record_is_completed: record?.completedCount || 0,
        record_is_Not_completed: record?.notCompletedCount || 0,
      };
    });

    res.status(200).json({ centersWithCounts });

  } catch (error) {
    console.error("Error in getRecordsCountByCenterForRadiologistInPeriod:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to retrieve data",
    });
  }
};

exports.getrangeRecordsCount = async (req, res) => {
  try {
    const { radiologistId } = req.params;
    const { startDate, endDate } = req.body;

    if (!mongoose.Types.ObjectId.isValid(radiologistId)) {
      return res.status(400).json({
        error: "Invalid ID",
        message: "The provided center ID is not valid",
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

    const radiologist = await Radiologist.findById(radiologistId);
    if (!radiologist) {
      return res.status(404).json({
        error: "Not Found",
        message: "Center not found",
      });
    }

    const records = await RadiologyRecord.aggregate([
      {
        $match: {
          radiologistId: new mongoose.Types.ObjectId(radiologistId),
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $project: {
          status: 1,
          createdAt: 1,
          
          jsDayOfWeek: { $mod: [{ $add: [{ $dayOfWeek: "$createdAt" }, 7] }, 7] },
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
