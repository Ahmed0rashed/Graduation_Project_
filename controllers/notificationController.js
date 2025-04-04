const { notifyUser } = require("../middleware/notfi");

async function sendNotification(req, res) {
    const { userType, userId } = req.body;
    if (!userType || !userId) {
        return res.status(400).json({ success: false, message: "يجب توفير userType و userId" });
    }
    const result = await notifyUser(userType, userId);
    res.json(result);
}


module.exports = { sendNotification };
