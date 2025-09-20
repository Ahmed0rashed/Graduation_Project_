const express = require("express");
const router = express.Router();
const walletController = require("../controllers/wallet.controller");


router.get("/getWallet/:userType/:userId", walletController.topUpWallet);

router.get("/balance/:userId", walletController.withdrawFunds);

router.get("/wallet-history/:userId", walletController.getWalletTransactions);
router.post("/withdrawal-request", walletController.requestWithdrawal);
router.get("/withdrawals/:userId", walletController.getUserWithdrawals);
router.post("/deduct", walletController.deductFromWallet);

module.exports = router;
