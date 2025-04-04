const notifier = require("node-notifier");
const RadiologyCenter = require("../models/Radiology_Centers.Model");
const Radiologist = require("../models/Radiologists.Model");
const mongoose = require("mongoose");

async function notifyUser(userType, userId) {
    try {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return { success: false, message: "معرّف المستخدم غير صالح!" };
        }

        let user;
        let userName;

        if (userType === "center") {
            user = await RadiologyCenter.findOne({ _id: userId });
            userName = user ? user.centerName : null;
        } else if (userType === "radiologist") {
            user = await Radiologist.findOne({ _id: userId });
            userName = user ? `${user.firstName} ${user.lastName}` : null;
        } else {
            return { success: false, message: "نوع المستخدم غير صالح!" };
        }

        if (!user) {
            return { success: false, message: "المستخدم غير موجود!" };
        }

        // إرسال الإشعار
        notifier.notify({
            title: `إشعار لـ ${userName}`,
            message: `مرحبًا ${userName}! لديك إشعار جديد 🎉`,
            sound: true,
            wait: false
        });

        console.log(`تم إرسال الإشعار إلى ${userName}`);
        return { success: true, message: `تم إرسال الإشعار إلى ${userName}` };
    } catch (error) {
        console.error("خطأ أثناء إرسال الإشعار:", error);
        return { success: false, message: "حدث خطأ أثناء إرسال الإشعار", error: error.message };
    }
}

module.exports = { notifyUser };