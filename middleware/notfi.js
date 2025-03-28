const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

const db = admin.firestore();


const sendNotification = async (userId, message) => {
  try {

    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      throw new Error("المستخدم غير موجود");
    }

    const userData = userDoc.data();
    const userType = userData.userType;
    const notification = {
      userId,
      message,
      userType,
      timestamp: new Date(),
    };


    await db.collection("notifications").add(notification);

    console.log(`تم إرسال الإشعار إلى ${userType} بنجاح`);
  } catch (error) {
    console.error("فشل في إرسال الإشعار:", error);
  }
};

module.exports = { sendNotification };
