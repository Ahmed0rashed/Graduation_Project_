const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/sendNotification");

// مسار API لإرسال الإشعارات
router.post("/send-notification", notificationController.sendNotification);

module.exports = router;
