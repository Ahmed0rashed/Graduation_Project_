const mongoose = require("mongoose");

const radiologyRecordSchema = new mongoose.Schema(
  {
    centerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RadiologyCenter",
      required: true,
    },
    radiologistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Radiologist",
    },
    patient_name: {
      type: String,
      required: false,
    },
    study_date: {
      type: Date,
      default: Date.now,
    },
    patient_id: {
      type: String,
    },
    sex: {
      type: String,
      enum: ["Male", "Female","Other"],
      required: false,
    },
    modality: {
      type: String,
    },
    PatientBirthDate: {
      type: Date,
      required: true,
    },
    age: {
      type: String,
    },
    body_part_examined: {
      type: String,
    },
    description: {
      type: String,
    },
    email: {
      type: String,
    },
    DicomId: {
      type: String,
      required: true,
    },
    series: {
      type: String,
    },
    deadline: {
      type: Date,
      default: function () {
        return new Date(Date.now() + 60 * 60 * 1000); 
      },
    },
    status: {
      type: String,
      enum: ["Available", "Pending", "Reviewed"],
      default: "Available",
    },
    deleted: {
      type: Boolean,
      default: false,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("RadiologyRecord", radiologyRecordSchema);
