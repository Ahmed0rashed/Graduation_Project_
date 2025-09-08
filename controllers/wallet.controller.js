const stripe = require('stripe')("sk_test_51QzGtQGgW7daCfmBOEgBz7v9gttS9bM2bX85VqMEuGDAFeZpgrTXMY2NE1UVcxDtdRZ4OEr9BVK4djfYb50v8Rv500gkQfbUkf");
const Wallet = require("../models/payment/Wallet.Model");
const Transaction = require("../models/payment/Transaction.Model");
const WithdrawRequest = require("../models/payment/WithdrawRequest.Model");


exports.topUpWallet = async (req, res) => {
  try {
    const { ownerId, ownerType, amount, paymentMethodId } = req.body;
    if (!ownerId || !ownerType || !amount || isNaN(amount) || amount <= 0 || !paymentMethodId) {
      return res.status(400).json({ message: "Invalid input" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: "usd",
      payment_method: paymentMethodId,
      confirm: true,
      description: `Wallet top-up for ${ownerType} ${ownerId}`
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

    res.status(200).json({ message: "Wallet topped up", wallet, paymentIntent });
  } catch (err) {
    console.error("Top-up failed:", err);
    res.status(500).json({ error: "Top-up failed" });
  }
};


exports.withdrawFunds = async (req, res) => {
  try {
    const { walletId, amount, destinationStripeAccount } = req.body;
    if (!walletId || !amount || amount <= 0 || !destinationStripeAccount) {
      return res.status(400).json({ message: "Invalid input" });
    }

    const wallet = await Wallet.findById(walletId);
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const transfer = await stripe.transfers.create({
      amount: amount * 100,
      currency: "usd",
      destination: destinationStripeAccount,
      description: "Wallet withdrawal"
    });

    wallet.balance -= amount;
    await wallet.save();

    await Transaction.create({
      fromWallet: wallet._id,
      toWallet: null,
      amount,
      type: "withdraw",
      description: "Withdrawal via Stripe"
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

    wallet.balance -= amount;
    await wallet.save();

    await Transaction.create({
      fromWallet: wallet._id,
      toWallet: null,
      amount,
      type: "withdraw",
      description: "Withdrawal to bank card"
    });

    res.status(200).json({ message: "Withdrawal to card successful", payout });
  } catch (err) {
    console.error("Withdrawal to card failed:", err);
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
