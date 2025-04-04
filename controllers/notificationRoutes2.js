const express = require("express");
const router = express.Router();
const { sendRichNotification, sendNotificationToUser } = require("../middleware/socketManager");

// إرسال إشعار عام
router.get("/sendnotification", (req, res) => {
    const title = "🚀 إشعار هام!";
    const message = "📢 لديك إشعار جديد من السيرفر!";
    const icon = "https://cdn-icons-png.flaticon.com/512/1827/1827343.png";
    const sound = "https://www.myinstants.com/media/sounds/notification-sound.mp3";

    sendRichNotification(title, message, icon, sound);
    res.json({ success: true, message: "تم إرسال الإشعار!" });
});

// إرسال إشعار لمستخدم محدد
router.post("/sendnotification/:userType/:userId", (req, res) => {
    const { userType, userId } = req.params;
    const { title, message, icon, sound } = req.body;

    const notificationSent = sendNotificationToUser(
        userId,
        userType,
        title || "🚀 إشعار هام!",
        message || "📢 لديك إشعار جديد!",
        icon || "https://cdn-icons-png.flaticon.com/512/1827/1827343.png",
        sound || "https://www.myinstants.com/media/sounds/notification-sound.mp3"
    );

    if (notificationSent) {
        res.json({ success: true, message: "تم إرسال الإشعار بنجاح!" });
    } else {
        res.status(404).json({ success: false, message: "المستخدم غير متصل حالياً" });
    }
});

module.exports = router;