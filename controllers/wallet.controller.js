const Wallet = require("../models/payment/Wallet.Model");
const WalletTransaction = require("../models/payment/WalletTransaction.Model");
const WithdrawRequest = require("../models/payment/WithdrawRequest.Model");
const sendNotification = require("../utils/sendNotification");



exports.topUpWallet = async (req, res) => {

  try {
    // const { ownerId, type } = req.params; 
    const { userId, userType } = req.params;

    if (!["RadiologyCenter", "Radiologist"].includes(userType)) {
      return res.status(400).json({ message: "نوع المستخدم غير صالح" });
    }
    console.log(userId, userType);
    const wallet = await Wallet.findOne({ ownerId: userId });
    console.log(wallet);
    if (!wallet) {
      return res.status(404).json({ message: "المحفظة غير موجودة" });
    }

    res.status(200).json({
      message: "Data fetched successfully",
      wallet,
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "حدث خطأ أثناء استرجاع المحفظة" });
  }
};



exports.withdrawFunds = async (req, res) => {

  try {
    const { userId } = req.params;
    const { type } = req.query;

    const wallet = await Wallet.findOne({ ownerId: userId });
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });

    res.json({ balance: wallet.balance });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getWalletTransactions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { userType } = req.query;

    if (!["RadiologyCenter", "Radiologist"].includes(userType)) {
      return res.status(400).json({ message: "نوع المستخدم غير صالح" });
    }

    const transactions = await WalletTransaction.find({
      userId,
      userType
    }).sort({ createdAt: -1 });

    res.status(200).json({
      message: "تم جلب سجل العمليات",
      transactions
    });

  } catch (err) {
    console.error("Transaction history error:", err);
    res.status(500).json({ message: "فشل في جلب سجل العمليات", error: err.message });
  }
};


exports.requestWithdrawal = async (req, res) => {
  try {
    const { userId, userType, amount } = req.body;

    const wallet = await Wallet.findOne({ ownerId: userId, ownerType: userType });
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const request = await WithdrawRequest.create({
      userId,
      userType,
      amount,
    });

    await sendNotification({
      userId: "67fe500364e9d7e5d709c6c6", // Replace with actual admin ID
      userType: "Admin",
      title: "Withdrawal Request",
      message: `New withdrawal request from a ${userType}`,
      // type: "withdrawal_request",
    });

    res.status(201).json({ message: "Withdrawal request sent", request });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUserWithdrawals = async (req, res) => {
  try {
    const { userId } = req.params;
    const { type } = req.query;

    const requests = await WithdrawRequest.find({
      userId,
      userType: type,
    }).sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
exports.deductFromWallet = async (req, res) => {
  try {
    const { userId, userType, amount, reason } = req.body;

    if (!userId || !userType || !amount) {
      return res.status(400).json({ message: "userId userType amount" });
    }

    if (!["RadiologyCenter", "Radiologist"].includes(userType)) {
      return res.status(400).json({ message: "نوع المستخدم غير صالح" });
    }

    const wallet = await Wallet.findOne({ ownerId: userId, ownerType: userType });
    if (!wallet) return res.status(404).json({ message: "المحفظة غير موجودة" });

    if (wallet.balance < amount) {
      return res.status(400).json({ message: "الرصيد غير كافي" });
    }

    wallet.balance -= amount;
    await wallet.save();

    await WalletTransaction.create({
      userId: userId,             // متوافق مع الـ schema
      userType: userType,         // enum قيمته صحيحة الآن
      type: "debit",
      amount,
      reason: reason || "خصم من المحفظة"
    });


    res.status(200).json({ message: "Withdrawal successful", transfer });
  } catch (err) {
    console.error("Withdrawal failed:", err);
    res.status(500).json({ error: "Withdrawal failed" });
  }
};


exports.withdrawToCard = async (req, res) => {
  try {
    const { walletId, amount, cardNumber } = req.body;
    if (!walletId || !amount || amount <= 0 || !cardNumber) {
      return res.status(400).json({ message: "Invalid input" });
    }

    const wallet = await Wallet.findById(walletId);
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const payout = await stripe.payouts.create({
      amount: amount * 100,
      currency: "usd",
      method: "instant",
      destination: cardNumber,
      description: "Withdrawal to bank card"

    });
  } catch (err) {    console.error("Withdrawal to card failed:", err);
    res.status(500).json({ error: "Withdrawal to card failed" });
  }
};


exports.transferFunds = async (req, res) => {
  try {
    const { amount, sourceAccount, destinationAccount } = req.body;
    if (!amount || amount <= 0 || !sourceAccount || !destinationAccount) {
      return res.status(400).json({ message: "Invalid input" });
    }

    const transfer = await stripe.transfers.create({
      amount: amount * 100,
      currency: "usd",
      source_transaction: sourceAccount,
      destination: destinationAccount,
      description: "Internal fund transfer"
    });

    res.status(200).json({ message: "Transfer successful", transfer });
  } catch (err) {
    console.error("Transfer failed:", err);
    res.status(500).json({ error: "Transfer failed" });
  }
};


exports.getStripeBalance = async (req, res) => {
  try {
    const balance = await stripe.balance.retrieve();
    res.status(200).json({ balance });
  } catch (err) {
    console.error("Failed to fetch balance:", err);
    res.status(500).json({ error: "Could not fetch balance" });
  }
};


exports.createConnectedAccount = async (req, res) => {
  try {
    const account = await stripe.accounts.create({
      type: 'express',
    });
    res.status(200).json({ account });
  } catch (err) {
    console.error("Failed to create account:", err);
    res.status(500).json({ error: "Account creation failed" });
  }
};


exports.createAccountLink = async (req, res) => {
  try {
    const { accountId } = req.body;
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: 'https://yourdomain.com/reauth',
      return_url: 'https://yourdomain.com/success',
      type: 'account_onboarding',
    });
    res.status(200).json({ accountLink });
  } catch (err) {
    console.error("Failed to create account link:", err);
    res.status(500).json({ error: "Account link creation failed" });

  }
};
