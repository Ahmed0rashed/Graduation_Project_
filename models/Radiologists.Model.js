const mongoose = require('mongoose');

const radiologistSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
  },
  specialization: {
    type: [String], 
    required: [true, 'At least one specialization is required'],
    trim: true,
    enum: {
      values: [
        'Chest Radiology',
        'Abdominal Radiology',
        'Head and Neck Radiology',
        'Musculoskeletal Radiology',
        'Neuroradiology',
        'Thoracic Radiology',
        'Cardiovascular Radiology'
      ],
      message: '{VALUE} is not a valid specialization'
    }
  },
  contactNumber: {
    type: String,
    required: [true, 'Contact number is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^\+?[\d\s-]{10,15}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number`
    }
  },
  status: {
    type: String,
    enum: ['online', 'offline'],
    default: 'online'
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true, 
    trim: true,
    lowercase: true,
  },
  availableHours: {
    start: {
      type: String,
      validate: {
        validator: function(v) {
          return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: props => `${props.value} is not a valid time format (HH:MM)`
      }
    },
    end: {
      type: String,
      validate: {
        validator: function(v) {
          return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: props => `${props.value} is not a valid time format (HH:MM)`
      }
    }
  },
  passwordHash: {
    type: String,
    required: [true, 'Password hash is required']
  },
  image: {
    type: String ,
    default: 'https://www.viverefermo.it/images/user.png',
  },
  numberOfReports: {
    type: Number,
    default: 0,
    ChestRadiology: {
      type: Number,
      default: 0
    },
    AbdominalRadiology: {
      type: Number,
      default: 0
    },
    Neuroradiology: {
      type: Number,
      default: 0
    },
    HeadandNeckRadiology: {
      type: Number,
      default: 0
    },
    MusculoskeletalRadiology: {
      type: Number,
      default: 0
    },
    ThoracicRadiology: {
      type: Number,
      default: 0
    },
    CardiovascularRadiology: {
      type: Number,
      default: 0
    }
  },
  experience: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Radiologist', radiologistSchema);
