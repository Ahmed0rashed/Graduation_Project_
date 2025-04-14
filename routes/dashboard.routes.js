const express = require("express");
const router = express.Router();

const dashboardController = require("../controllers/dashboard.controller");

router.get("/getCenterStatistics/:centerId", dashboardController.getCenterStatistics);
router.get("/getRecordsCountPerDayInCenter/:centerId", dashboardController.getRecordsCountPerDayInCenter);
router.get("/getRecordsCountPerDayInCenterPerStatus/:centerId", dashboardController.getRecordsCountPerDayInCenterPerStatus);
router.get("/getWeeklyRecordsCountPerDayInCenterPerStatus/:centerId", dashboardController.getWeeklyRecordsCountPerDayInCenterPerStatus);
module.exports = router;