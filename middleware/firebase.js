const admin = require("firebase-admin");

// تحميل مفتاح الخدمة من ملف JSON (تأكد من مساره الصحيح)
const serviceAccount = require("../graduationproject-287f2-firebase-adminsdk-fbsvc-73b38af252.json");

// تهيئة Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;
