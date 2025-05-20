const mongoose = require("mongoose");
const CenterRadiologistsRelation = require("../models/CenterRadiologistsRelation.Model");
const RadiologyCenter = require("../models/Radiology_Centers.Model");
const Radiologist = require("../models/Radiologists.Model");
const RadiologyRecord = require("../models/RadiologyRecords.Model");


exports.getCenterStatistics = async (req, res) => {
  try {
    const { centerId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(centerId)) {
      return res.status(400).json({
        error: "Invalid ID",
        message: "The provided center ID is not valid",
      });
    }

    const center = await RadiologyCenter.findById(centerId);
    if (!center) {
      return res.status(404).json({
        error: "Not Found",
        message: "Center not found",
      });
    }

    const onlineRadiologists = await CenterRadiologistsRelation.findOne({
      center: centerId,
    })
      .populate({
        path: "radiologists",
        match: { status: "online" },
        select: "-passwordHash",
      })
      .select("radiologists");

    const totalRadiologists = await CenterRadiologistsRelation.findOne({
      center: centerId,
    }).populate({
      path: "radiologists",
      select: "-passwordHash",
    });

    res.status(200).json({
      message: "retrieved successfully",
      data: {
        onlineRadiologists: onlineRadiologists.radiologists.length,
        onlineRadiologistsDetails: onlineRadiologists.radiologists,
        totalRadiologists: totalRadiologists.radiologists.length,
      },
    });
  } catch (error) {
    console.error("Error in getradiologists:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to retrieve data",
    });
  }
};

exports.getRecordsCountPerDayInCenter = async (req, res) => {
  try {
    const { centerId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(centerId)) {
      return res.status(400).json({
        error: "Invalid ID",
        message: "The provided center ID is not valid",
      });
    }

    const center = await RadiologyCenter.findById(centerId);
    if (!center) {
      return res.status(404).json({
        error: "Not Found",
        message: "Center not found",
      });
    }

  
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    
    const recordsToday = await RadiologyRecord.countDocuments({
      centerId,
      createdAt: { $gte: startOfDay, $lt: endOfDay },
    });

  
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay())); 
    const endOfWeek = new Date(startOfWeek).setDate(startOfWeek.getDate() + 6); 

    const recordsThisWeek = await RadiologyRecord.countDocuments({
      centerId,
      createdAt: {
        $gte: startOfWeek,
        $lt: new Date(endOfWeek),
      },
    });

    
    const startOfMonth = new Date(today.setDate(1)); 
    const endOfMonth = new Date(today.setMonth(today.getMonth() + 1, 0)); 

    const recordsThisMonth = await RadiologyRecord.countDocuments({
      centerId,
      createdAt: {
        $gte: startOfMonth,
        $lt: endOfMonth,
      },
    });

    res.status(200).json({
      message: "retrieved successfully",
      data: {
        today: recordsToday,
        thisWeek: recordsThisWeek,
        thisMonth: recordsThisMonth,
      },
    });
  } catch (error) {
    console.error("Error in getRecordsCountPerDayInCenter:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to retrieve data",
    });
  }
};


exports.getRecordsCountPerDayInCenterPerStatus = async (req, res) => {
  try {
    const { centerId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(centerId)) {
      return res.status(400).json({
        error: "Invalid ID",
        message: "The provided center ID is not valid",
      });
    }

    const center = await RadiologyCenter.findById(centerId);
    if (!center) {
      return res.status(404).json({
        error: "Not Found",
        message: "Center not found",
      });
    }

    const today = new Date();

    // Calculate start and end of the day
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Calculate start and end of the week
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    const endOfWeek = new Date(startOfWeek).setDate(startOfWeek.getDate() + 6);

    // Calculate start and end of the month
    const startOfMonth = new Date(today.setDate(1));
    const endOfMonth = new Date(today.setMonth(today.getMonth() + 1, 0));

    // Calculate start and end of the year
    const startOfYear = new Date(today.setMonth(0, 1)); // January 1st
    const endOfYear = new Date(today.setMonth(11, 31)); // December 31st

    // Helper function to count records for each period and status
    const countRecords = async (startDate, endDate, status = null) => {
      const query = {
        centerId,
        createdAt: { $gte: startDate, $lt: endDate },
      };
      if (status) query.status = status;
      return await RadiologyRecord.countDocuments(query);
    };

    // Counts per status for today
    const recordsTodayPending = await countRecords(startOfDay, endOfDay, "Diagnose");
    const recordsTodayReviewed = await countRecords(startOfDay, endOfDay, "Completed");
    const recordsTodayAvailable = await countRecords(startOfDay, endOfDay, "Ready");
    const recordsTodayTotal = await countRecords(startOfDay, endOfDay);

    // Counts per status for this week
    const recordsWeekPending = await countRecords(startOfWeek, endOfWeek, "Diagnose");
    const recordsWeekReviewed = await countRecords(startOfWeek, endOfWeek, "Completed");
    const recordsWeekAvailable = await countRecords(startOfWeek, endOfWeek, "Ready");
    const recordsWeekTotal = await countRecords(startOfWeek, endOfWeek);

    // Counts per status for this month
    const recordsMonthPending = await countRecords(startOfMonth, endOfMonth, "Diagnose");
    const recordsMonthReviewed = await countRecords(startOfMonth, endOfMonth, "Completed");
    const recordsMonthAvailable = await countRecords(startOfMonth, endOfMonth, "Ready");
    const recordsMonthTotal = await countRecords(startOfMonth, endOfMonth);

    // Counts per status for this year
    const recordsYearPending = await countRecords(startOfYear, endOfYear, "Diagnose");
    const recordsYearReviewed = await countRecords(startOfYear, endOfYear, "Completed");
    const recordsYearAvailable = await countRecords(startOfYear, endOfYear, "Ready");
    const recordsYearTotal = await countRecords(startOfYear, endOfYear);

    res.status(200).json({
      message: "retrieved successfully",
      data: {
        today: {
          total: recordsTodayTotal,
          Diagnose: recordsTodayPending,
          Completed: recordsTodayReviewed,
          Ready: recordsTodayAvailable,
        },
        week: {
          total: recordsWeekTotal,
          Diagnose: recordsWeekPending,
          Completed: recordsWeekReviewed,
          Ready: recordsWeekAvailable,
        },
        month: {
          total: recordsMonthTotal,
          Diagnose: recordsMonthPending,
          reviewed: recordsMonthReviewed,
          Ready: recordsMonthAvailable,
        },
        year: {
          total: recordsYearTotal,
          Diagnose: recordsYearPending,
          Completed: recordsYearReviewed,
          Ready: recordsYearAvailable,
        },
      },
    });
  } catch (error) {
    console.error("Error in getRecordsCountPerDayInCenterPerStatus:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to retrieve data",
    });
  }
};

exports.getWeeklyRecordsCountPerDayInCenterPerStatus = async (req, res) => {
  try {
    const { centerId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(centerId)) {
      return res.status(400).json({
        error: "Invalid ID",
        message: "The provided center ID is not valid",
      });
    }

    const center = await RadiologyCenter.findById(centerId);
    if (!center) {
      return res.status(404).json({
        error: "Not Found",
        message: "Center not found",
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
          centerId: new mongoose.Types.ObjectId(centerId),
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

exports.getrangeRecordsCount = async (req, res) => {
  try {
    const { centerId } = req.params;
    const { startDate, endDate } = req.body;

    if (!mongoose.Types.ObjectId.isValid(centerId)) {
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

    const center = await RadiologyCenter.findById(centerId);
    if (!center) {
      return res.status(404).json({
        error: "Not Found",
        message: "Center not found",
      });
    }

    const records = await RadiologyRecord.aggregate([
      {
        $match: {
          centerId: new mongoose.Types.ObjectId(centerId),
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $project: {
          status: 1,
          createdAt: 1,
          // نحول اليوم بحيث يكون السبت = 0
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

exports.getTotalRecordsCountInCenter = async (req, res) => {
  try {
    const { centerId } = req.params;
    const { startDate, endDate } = req.body;

    if (!mongoose.Types.ObjectId.isValid(centerId)) {
      return res.status(400).json({
        error: "Invalid ID",
        message: "The provided center ID is not valid",
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: "Missing Parameters",
        message: "Both startDate and endDate are required in request body",
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

    const center = await RadiologyCenter.findById(centerId);
    if (!center) {
      return res.status(404).json({
        error: "Not Found",
        message: "Center not found",
      });
    }

    // Count the total number of records within the date range
    const totalRecords = await RadiologyRecord.aggregate([
      {
        $match: {
          centerId: new mongoose.Types.ObjectId(centerId),
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $count: "total", // Count all records
      },
    ]);

    if (totalRecords.length === 0) {
      return res.status(200).json({
        message: "No records found",
        total: 0,
      });
    }

    res.status(200).json({
      message: "Total records retrieved successfully",
      total: totalRecords[0].total,
    });
  } catch (error) {
    console.error("Error in getTotalRecordsCountInCenter:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to retrieve data",
    });
  }
};
