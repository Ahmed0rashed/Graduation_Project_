const mongoose = require('mongoose');

const radiologyRecordSchema = new mongoose.Schema({

  center: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RadiologyCenter',
    required: true
  },
  patient_name: {
    type: String,
  },
  study_date: {
    type: Date,
    default: Date.now
  },
  patient_id: {
    type: String,
  },
  sex: {
    type: String,
    enum: ['M', 'F'],
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
}, { timestamps: true });

module.exports = mongoose.model('RadiologyRecord', radiologyRecordSchema);
