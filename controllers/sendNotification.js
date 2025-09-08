const admin = require("../middleware/firebase");

exports.sendNotification = async (req, res) => {
  try {
    const { token, title, body } = req.body;

    if (!token || !title || !body) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const message = {
      notification: { title, body },
      token,
    };

    await admin.messaging().send(message);
    console.log(" Notification sent successfully!");
    return res.status(200).json({ success: true, message: "Notification sent successfully!" });
  } catch (error) {
    console.error(" Error sending notification:", error);

    let errorMessage = "Failed to send notification";
    if (error.code === "messaging/invalid-registration-token") {
      errorMessage = "Invalid FCM registration token";
    } else if (error.code === "messaging/registration-token-not-registered") {
      errorMessage = "Token is not registered";
    }

    return res.status(500).json({ success: false, error: errorMessage });
  }
};
