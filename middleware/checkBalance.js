const Wallet = require("../models/payment/Wallet.Model");

const checkBalance = async (req, res, next) => {
  try {
    const { fromWalletId, amount } = req.body;

    if (!fromWalletId || !amount) {
      return res.status(400).json({ message: "Missing fromWalletId or amount" });
    }

    const wallet = await Wallet.findById(fromWalletId);

    if (!wallet) {
      return res.status(404).json({ message: "Sender wallet not found" });
    }

    if (wallet.balance < amount) {
      return res.status(400).json({ message: "Insufficient wallet balance" });
    }


    req.wallet = wallet;
    next();
  } catch (err) {
    console.error("Balance check error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = checkBalance;
