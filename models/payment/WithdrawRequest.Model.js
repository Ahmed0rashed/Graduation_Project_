// models/WithdrawRequest.js
const mongoose = require("mongoose");

const withdrawRequestSchema = new mongoose.Schema({
  wallet: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet", required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
  decisionAt: { type: Date },
  notes: { type: String }
});

module.exports = mongoose.model("WithdrawRequest", withdrawRequestSchema);
