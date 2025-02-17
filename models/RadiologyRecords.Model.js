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
      required: true,
    },
    patient_name: {
      type: String,
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
      enum: ["M", "F"],
    },
    modality: {
      type: String,
    },
    PatientBirthDate: {
      type: Date,
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("RadiologyRecord", radiologyRecordSchema);
