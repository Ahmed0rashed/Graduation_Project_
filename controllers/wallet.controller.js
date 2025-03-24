const Wallet = require("../models/payment/Wallet.Model");
const Transaction = require("../models/payment/Transaction.Model");
console.log(process.env.STRIPE_SECRET_KEY);
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const WithdrawRequest = require("../models/payment/WithdrawRequest.Model");
const Subscription = require("../models/payment/Subscription.Model");
const Notification = require("../models/payment/Notification.Model");



// 🟩 Helper to decrease balance
const decreaseWalletBalance = async (wallet, amount) => {
  wallet.balance -= amount;
  await wallet.save();
};

// 🟩 Helper to send notification
const sendNotification = async (userId, userType, message) => {
  await Notification.create({ userId, userType, message });
};

// ✅ Transfer funds between wallets
exports.transferFunds = async (req, res) => {
  try {
    const { fromWalletId, toWalletId, amount, type, description } = req.body;

    if (!fromWalletId || !toWalletId || !amount || !type || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Invalid input" });
    }

    if (fromWalletId === toWalletId) {
      return res.status(400).json({ message: "Cannot transfer to the same wallet" });
    }

    const fromWallet = await Wallet.findById(fromWalletId);
    const toWallet = await Wallet.findById(toWalletId);

    if (!fromWallet || !toWallet || fromWallet.balance < amount) {
      return res.status(400).json({ message: "Wallet not found or insufficient balance" });
    }

    await decreaseWalletBalance(fromWallet, amount);
    toWallet.balance += amount;
    await toWallet.save();

    const transaction = await Transaction.create({
      fromWallet: fromWallet._id,
      toWallet: toWallet._id,
      amount,
      type,
      description
    });

    res.status(200).json({ message: "Transfer successful", transaction });
  } catch (err) {
    console.error("Transfer failed:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Top up wallet via Stripe
exports.topUpWallet = async (req, res) => {
  try {
    const { ownerId, ownerType, amount, token } = req.body;

    if (!ownerId || !ownerType || !amount || !token || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Invalid input" });
    }

    await stripe.charges.create({
      amount: amount * 100,
      currency: "usd",
      source: token,
      description: `Top-up wallet for ${ownerType} ${ownerId}`,
    });

    const wallet = await Wallet.findOneAndUpdate(
      { ownerId, ownerType },
      { $inc: { balance: amount } },
      { upsert: true, new: true }
    );

    await Transaction.create({
      fromWallet: null,
      toWallet: wallet._id,
      amount,
      type: "top_up",
      description: "Top-up via Stripe"
    });

    res.status(200).json({ message: "Wallet topped up", wallet });
  } catch (err) {
    console.error("Top-up failed:", err);
    res.status(500).json({ error: "Top-up failed" });
  }
};

// ✅ Pay for a report
exports.transferForReport = async (req, res) => {
  try {
    const { fromWalletId, toWalletId, amount, reportId } = req.body;

    if (!fromWalletId || !toWalletId || !amount || !reportId  || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Invalid input" });
    }

    const fromWallet = await Wallet.findById(fromWalletId);
    if (!fromWallet || fromWallet.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const toWallet = await Wallet.findByIdAndUpdate(
      toWalletId,
      { $inc: { balance: amount } },
      { new: true, upsert: true }
    );

    await decreaseWalletBalance(fromWallet, amount);

    await Transaction.create({
      fromWallet: fromWallet._id,
      toWallet: toWallet._id,
      amount,
      type: "report-payment",
      description: `Payment for report ${reportId}`
    });

    await sendNotification(toWallet.ownerId, "Radiologist", `تم إضافة $${amount} مقابل التقرير رقم ${reportId}`);

    res.status(200).json({ message: "Payment transferred", fromWallet, toWallet });
  } catch (err) {
    console.error("Transfer failed:", err);
    res.status(500).json({ error: "Transfer failed" });
  }
};


// ✅ Subscribe using wallet
exports.subscribeFromWallet = async (req, res) => {
  try {
    const { fromWalletId, planType, amount, durationInMonths } = req.body;

    if (!fromWalletId || !planType || !amount || !durationInMonths || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Invalid input" });
    }

    const wallet = await Wallet.findById(fromWalletId);
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    await decreaseWalletBalance(wallet, amount);

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + durationInMonths);

    const subscription = await Subscription.create({
      centerId:wallet.ownerId,
      planType,
      amount,
      durationInMonths,
      startDate,
      endDate,
      isActive: true
    });

    await Transaction.create({
      fromWallet: wallet._id,
      toWallet: null,
      amount: amount,
      type: "subscription",
      description: `Subscription for ${planType}`
    });

    res.status(200).json({ message: "Subscription activated", subscription });
  } catch (err) {
    console.error("Subscription failed:", err);
    res.status(500).json({ error: "Subscription failed" });
  }
};


// ✅ Get wallet balance
exports.getWalletBalance = async (req, res) => {
  try {
    const { userId } = req.params;
    const wallet = await Wallet.findOne({ ownerId: userId });
    res.status(200).json({ userId, balance: wallet?.balance || 0 });
  } catch (err) {
    console.error("Balance fetch failed:", err);
    res.status(500).json({ error: "Could not fetch balance" });
  }
};

// ✅ Get wallet by owner
exports.getWalletByOwner = async (req, res) => {
  try {
    const { ownerId, ownerType } = req.query;

    if (!ownerId || !ownerType) {
      return res.status(400).json({ message: "Missing ownerId or ownerType" });
    }

    const wallet = await Wallet.findOne({ ownerId, ownerType });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    res.status(200).json({ wallet });
  } catch (err) {
    console.error("Fetch wallet failed:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ Get all transactions for a wallet
exports.getWalletTransactions = async (req, res) => {
  try {
    const { walletId } = req.params;
    const transactions = await Transaction.find({
      $or: [{ fromWallet: walletId }, { toWallet: walletId }]
    }).sort({ createdAt: -1 });

    res.status(200).json({ transactions });
  } catch (err) {
    console.error("Fetch transactions failed:", err);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
};

// ✅ Create withdraw request
// controllers/wallet.controller.js

exports.createWithdrawRequest = async (req, res) => {
  try {
    const { walletId, amount } = req.body;

    if (!walletId || !amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid input" });
    }

    const wallet = await Wallet.findById(walletId);
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const withdrawRequest = await WithdrawRequest.create({
      wallet: walletId,
      amount
    });

    res.status(201).json({ message: "Withdraw request submitted", withdrawRequest });
  } catch (err) {
    console.error("Withdraw request error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};


// ✅ Admin update withdraw request
exports.updateWithdrawStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, notes } = req.body;

    // تحقق من أن الحالة إما "approved" أو "rejected"
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // العثور على طلب السحب
    const request = await WithdrawRequest.findById(requestId).populate("wallet");
    if (!request) return res.status(404).json({ message: "Withdraw request not found" });
    if (request.status !== "pending") return res.status(400).json({ message: "Already processed" });

    // إذا كانت الحالة "approved"، نخصم المبلغ من المحفظة
    if (status === "approved") {
      if (request.wallet.balance < request.amount) {
        return res.status(400).json({ message: "Insufficient balance for approval" });
      }

      // خصم المبلغ من رصيد المحفظة
      request.wallet.balance -= request.amount;
      await request.wallet.save();

      // إنشاء معاملة جديدة مع النوع "withdraw"
      await Transaction.create({
        fromWallet: request.wallet._id,
        toWallet: null,  // لا يوجد محفظة استقبال للمعاملة
        amount: request.amount,
        type: "withdraw",  // يجب أن يكون "withdraw"
        description: "Approved withdraw request"
      });
    }

    // تحديث حالة الطلب وتعيين الملاحظات
    request.status = status;
    request.notes = notes || "";
    request.decisionAt = new Date();
    await request.save();

    res.status(200).json({ message: `Withdraw request ${status}`, request });
  } catch (err) {
    console.error("Withdraw status update error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// وظيفة لاسترجاع جميع طلبات السحب
exports.getAllWithdrawRequests = async (req, res) => {
  try {
    const requests = await WithdrawRequest.find()
      .populate("wallet")
      .sort({ createdAt: -1 });

    res.status(200).json({ requests });
  } catch (err) {
    console.error("Fetching withdraw requests failed:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
