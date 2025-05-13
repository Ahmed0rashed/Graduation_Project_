const mongoose = require("mongoose");

const commentsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,

    },
    userType: {
      type: String,
      enum: ["Radiologist", "RadiologyCenter"],

    },
    image: {
      type: String,
    },
    name: {
      type: String,
    },
    recordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RadiologyRecords",
      required: false,
    },
    dicom_Comment: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

// Capitalized model name as convention
module.exports = mongoose.model("Comment", commentsSchema);
