const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "ownerType", // ممكن يكون Center أو Radiologist
    },
    ownerType: {
      type: String,
      required: true,
      enum: ["RadiologyCenter", "Radiologist"],
    },
    balance: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Wallet", walletSchema);
