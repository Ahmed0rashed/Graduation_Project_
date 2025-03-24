const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'ownerType',
    required: true,
  },
  ownerType: {
    type: String,
    enum: ['RadiologyCenter', 'Radiologist'],
    required: true,
  },
  balance: {
    type: Number,
    default: 0,
  }
}, { timestamps: true });

walletSchema.index({ ownerId: 1, ownerType: 1 }, { unique: true });

module.exports = mongoose.model('Wallet', walletSchema);
