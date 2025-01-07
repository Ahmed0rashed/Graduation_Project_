const mongoose = require('mongoose');

const radiologyCenterSchema = new mongoose.Schema({
  centerName: {
    type: String,
    required: true
  },
  address: {
    type: String,
  },
  contactNumber: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
  },
  passwordHash: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('RadiologyCenter', radiologyCenterSchema);
