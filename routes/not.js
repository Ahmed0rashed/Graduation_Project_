const express = require('express');
const bodyParser = require("body-parser");
const { sendNotification } = require("../controllers/notificationController");
// const { sendNotificationToUser } = require("../controllers/notificationController");

const router = express.Router();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

router.post('/sendnotification', sendNotification);
router.post('/sendnotification/:userType/:userId', sendNotification);

module.exports = router;