const mongoose = require("mongoose");

const walletTransactionSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  userType: {
    type: String,
    enum: ["RadiologyCenter", "Radiologist"],
  },
  amount: Number,
  type: {
    type: String,
    enum: ["credit", "debit"]
  },
  reason: String, // e.g. "payment confirmed", "report reward", "withdrawal"
  relatedId: String, // could be paymentId or reportId or withdrawalId
}, { timestamps: true });

module.exports = mongoose.model("WalletTransaction", walletTransactionSchema);
