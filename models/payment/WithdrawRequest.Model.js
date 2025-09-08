const mongoose = require("mongoose");

const withdrawRequestSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Radiologist",
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
},
  { timestamps: true });

module.exports = mongoose.model("WithdrawRequest", withdrawRequestSchema);
