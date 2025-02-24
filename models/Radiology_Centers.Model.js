const mongoose = require('mongoose');

const radiologyCenterSchema = new mongoose.Schema({
  centerName: {
    type: String,
    required: [true, 'Center name is required'],
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  contactNumber: {
    type: String,
    validate: {
      validator: function(v) {
        return /^\+?[\d\s-]{10,15}$/.test(v);
      },
      message: props => `${props.value} is not a valid contact number`
    },
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true, 
    trim: true,
    lowercase: true,
  },
  passwordHash: {
    type: String,
    required: [false, 'Password hash is required'],
  },
  path: {  
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('RadiologyCenter', radiologyCenterSchema);
