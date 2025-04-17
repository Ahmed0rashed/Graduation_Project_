const express = require("express");
const router = express.Router();

const dashboardController = require("../controllers/RadiologistDashboard");

router.get("/getRecordsCountForRadiologistInPeriod/:radiologistId", dashboardController.getRecordsCountForRadiologistInPeriod);
router.get("/getRecordsCountByStudyType/:radiologistId", dashboardController.getRecordsCountByStudyType);
router.get("/getNumberOfReports/:radiologistId", dashboardController.getNumberOfReports);
module.exports = router;