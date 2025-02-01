const mongoose = require('mongoose');
const { Schema } = mongoose;

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
    type: String,
    required: [true, 'Specialization is required'],
    trim: true,
    enum: {
      values: [
        'Diagnostic Radiology',
        'Interventional Radiology',
        'Nuclear Medicine',
        'Pediatric Radiology',
        'Neuroradiology',
        'Musculoskeletal Radiology',
        'Emergency Radiology'
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
    enum: ['Active', 'Inactive', 'On Leave', 'Suspended'],
    default: 'Active'
  },
  email: { type: String, required: true, unique: true },

  passwordHash: {
    type: String,
    required: [true, 'Password hash is required']
  },
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// تأكد من أن الفهرس مضاف تلقائيًا في email: { unique: true }

module.exports = mongoose.model('Radiologist', radiologistSchema);
