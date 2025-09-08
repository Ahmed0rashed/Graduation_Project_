const admin = require("firebase-admin");


const serviceAccount = require("../graduationproject-287f2-firebase-adminsdk-fbsvc-73b38af252.json");


if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;
