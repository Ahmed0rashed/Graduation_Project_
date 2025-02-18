const mongoose = require("mongoose");

const aiReportSchema = new mongoose.Schema(
  {
    record: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RadiologyRecord",
      required: true,
      index: true,
    },
    centerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RadiologyCenter",
      required: true,
    },
    radiologistID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Radiologist",
    },
    diagnosisReportFinding: {
      type: String,
    },
    diagnosisReportImpration: {
      type: String,
    }, diagnosisReportComment: {
      type: String,
    },
    result: {
      type: String,
      enum: ["New", "Normal", "Critical", "Follow-up"],
      default: "New",
    },
    status: {
      type: String,
      enum: ["Available", "Pending", "Reviewed"],
      default: "Available",
    },
    confidenceLevel: {
      type: Number,
      min: [0, "Confidence level cannot be less than 0"],
      max: [100, "Confidence level cannot be greater than 100"],
      default: -1,
    },
    generatedDate: {
      type: Date,
      default: Date.now,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AIReport", aiReportSchema);