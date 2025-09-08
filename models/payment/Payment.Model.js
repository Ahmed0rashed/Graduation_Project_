const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  centerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Center',
    required: true,
  },
  amountCents: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: "EGP"
  },
  billingData: {
    type: Object, // أو تفصّلها حسب الحاجة
    required: true
  },
  paymobOrderId: {
    type: String,
    required: true
  },
  iframeUrl: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed'],
    default: 'pending'
  },
  method: {
    type: String,
    default: 'Paymob'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Payment', paymentSchema);
