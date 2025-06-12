const express = require("express");
const router = express.Router();

const dashboardController = require("../controllers/RadiologistDashboard");

router.post("/getRecordsCountForRadiologistInPeriod/:radiologistId", dashboardController.getRecordsCountForRadiologistInPeriod);
router.get("/getRecordsCountByStudyType/:radiologistId", dashboardController.getRecordsCountByStudyType);
router.get("/getNumberOfReports/:radiologistId", dashboardController.getNumberOfReports);
router.post("/getRecordsCountByStatus/:radiologistId", dashboardController.getRecordsCountByStatus);
router.post("/getAverageTimeToCompleteReport/:radiologistId", dashboardController.getAverageTimeToCompleteReport);
router.get("/getWeeklyRecordsCountPerDayPerStatus/:radiologistsId", dashboardController.getWeeklyRecordsCountPerDayPerStatus);
router.post("/getAllCompletedRecordsbyradiologist/:radiologistsId", dashboardController.getRecordsCountByCenterForRadiologistInPeriod);
module.exports = router;