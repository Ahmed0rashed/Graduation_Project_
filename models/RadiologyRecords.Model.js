const mongoose = require("mongoose");

const radiologyRecordSchema = new mongoose.Schema(
  {
    centerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RadiologyCenter",
      required: true,
    },
    centerId_Work_on_Dicom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RadiologyCenter",
      required: true,
    },
    radiologistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Radiologist",
    },
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AIReport",
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
      enum: ["Male", "Female", "Unknown"],
      required: false,
    },
    modality: {
      type: String,
    },
    PatientBirthDate: {
      type: Date,
      required: false,
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
    DicomId: [{
      type: String,
      required: false,
    }],
    series: {
      type: String,
    },
    deadline: {
      type: Date,
      default: function () {
        return new Date(Date.now() + 60 * 60 * 24 * 1000);
      },
    },
    status: {
      type: String,
      enum: ["Ready", "Diagnose",  "Completed","Cancled"],
      default: "Ready",
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    Dicom_url:[ {
      type: String,
      required: true,
    }],
    study_description: {
      type: String,
    },
    Study_Instance_UID: {
      type: String,
    },
    Series_Instance_UID: {
      type: String,
    },
    cancledby: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Radiologist",
      },
    ],
    specializationRequest: {
      type: String,
    },
comment_id: {
  type: mongoose.Schema.Types.ObjectId,
  default: () => new mongoose.Types.ObjectId(),
},
    flag: {
      type: Boolean,
      default: false,
    }, 
    useOuerRadiologist: {
      type: Boolean,
      default: false,
    },
    phoneNumber: {
      type: String,
    },
    diagnoseAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RadiologyRecord", radiologyRecordSchema);
