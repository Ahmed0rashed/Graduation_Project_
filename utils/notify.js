const Notification = require("../models/payment/Notification.Model");

exports.sendNotification = async (userId, userType, message) => {
  try {
    await Notification.create({ userId, userType, message });
  } catch (err) {
    console.error("Notification failed:", err);
  }
};
