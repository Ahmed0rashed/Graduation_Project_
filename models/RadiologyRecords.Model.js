const mongoose = require('mongoose');

const radiologyRecordSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  center: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RadiologyCenter',
    required: true
  },
  radiationType: {
    type: String,
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  dicoPath: {
    type: String,
  },
  comments: {
    type: String,
  },
  recordStatus: {
    type: String,
    enum: ['Pending', 'Reviewed', 'Confirmed'],
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('RadiologyRecord', radiologyRecordSchema);
