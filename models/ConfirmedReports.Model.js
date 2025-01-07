const mongoose = require('mongoose');

const confirmedReportSchema = new mongoose.Schema({
  record: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RadiologyRecord',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Radiologist',
    required: true
  },
  finalDiagnosis: {
    type: String,
    required: true
  },
  confirmationDate: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('ConfirmedReport', confirmedReportSchema);
