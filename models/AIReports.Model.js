const mongoose = require('mongoose');

const aiReportSchema = new mongoose.Schema({
  record: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RadiologyRecord',
    required: true
  },
  diagnosisReport: {
    type: String,
    required: true
  },
  confidenceLevel: {
    type: Number,
    required: true
  },
  generatedDate: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('AIReport', aiReportSchema);
