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
    required: [true, 'Email is required ...'],
    unique: true,  // تأكد من عدم إضافة schema.index() بشكل مكرر هنا
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: props => `${props.value} is not a valid email address`
    }
  },
  passwordHash: {
    type: String,
    required: [true, 'Password hash is required'],
  },
}, { 
  timestamps: true
});

module.exports = mongoose.model('RadiologyCenter', radiologyCenterSchema);
