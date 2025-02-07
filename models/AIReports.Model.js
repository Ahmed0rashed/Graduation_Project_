const mongoose = require("mongoose");

const aiReportSchema = new mongoose.Schema(
  {
    record: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RadiologyRecord",
      required: true,
    },
    diagnosisReport: {
      type: String,
      required: true,
    },
    // add status
    result: {
      type: String,
      enum: ["New", "Normal", "Critical", "Follow-up"],
      default: "New",
    },
    status: {
      type: String,
      enum: ["Available", "Claimed", "Pending", "Reviewed"],
      default: "Available",
    },
    confidenceLevel: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0,
    },
    generatedDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AIReport", aiReportSchema);
