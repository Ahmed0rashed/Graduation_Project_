const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  fromWallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet'
  },
  toWallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet'
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ["top_up", "withdraw", "subscription", "report-payment", "transfer"],
  },

  description: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'success'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);
