const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  centerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RadiologyCenter',
    required: true,
  },
  planType: {
    type: String,
    enum: ['basic', 'standard', 'premium'],
    required: true,
  },
  durationInMonths: {
    type: Number,
    required: true,
    validate: {
      validator: Number.isInteger,
      message: 'Duration must be an integer value.',
    },
    min: 1,
    max: 12, // Assuming maximum subscription duration is 12 months. Adjust as needed.
  },
  amount: {
    type: Number,
    required: true,
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: Date,
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
