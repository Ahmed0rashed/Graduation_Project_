const axios = require("axios");

const sendNotification = async ({ userId, userType, title, message, type }) => {
  try {
    await axios.post("https://graduation-project--xohomg.fly.dev/api/notifications/send", {
      userId,
      userType,
      title,
      message,
      type
    });
  } catch (error) {
    console.error("Failed to send notification:", error.message);
  }
};

module.exports = sendNotification;
