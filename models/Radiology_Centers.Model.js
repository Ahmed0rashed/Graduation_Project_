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

  email: { type: String, required: true, unique: true },
  passwordHash: {
    type: String,
    required: [true, 'Password hash is required'],
  },
}, { 
  timestamps: true
});

module.exports = mongoose.model('RadiologyCenter', radiologyCenterSchema);
