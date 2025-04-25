// models/Notification.Model.js
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    userType: {
      type: String,
      required: true,
      enum: ["Radiologist", "ٌRadiologyCenter"],
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    icon: { type: String, default: "" },
    sound: {
      type: String,
      default:
        "https://www.epidemicsound.com/sound-effects/tracks/a5ddf44b-231b-406b-a99e-035d1a330863/",
    },
    isRead: { type: Boolean, default: false },
    sendername: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
    // type: {
    //   type: String,
    //   enum: [
    //     "massage",
    //     "report",
    //   ],
    //   default: "general",
    // },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
