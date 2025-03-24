const express = require("express");
const router = express.Router();
const walletController = require("../controllers/wallet.controller");
const checkBalance = require("../middleware/checkBalance");

// 🏦 تسجيل طلب سحب
router.post("/wallet/withdraw-request", walletController.createWithdrawRequest);

// 💸 تحويل بين المحافظ
router.post('/wallet/transfer', walletController.transferFunds);

// 💳 شحن المحفظة عن طريق Stripe
router.post("/wallet/topup", walletController.topUpWallet);

// 📄 دفع للطبيب بعد إنهاء التقرير
router.post(
  "/wallet/pay-report",
  checkBalance,
  walletController.transferForReport
);

// 💼 اشتراك بالخطة من المحفظة
router.post(
  "/wallet/subscribe",
  checkBalance,
  walletController.subscribeFromWallet
);

// 📊 عرض رصيد المحفظة
router.get("/wallet/balance/:userId", walletController.getWalletBalance);

// 📘 عرض سجل المعاملات
router.get("/wallet/transactions/:walletId", walletController.getWalletTransactions);

// 📂 عرض محفظة من خلال ownerId + ownerType
router.get("/wallet/by-owner", walletController.getWalletByOwner);

// 👨‍💼 عرض طلبات السحب للأدمن
router.get("/admin/withdraw-requests", walletController.getAllWithdrawRequests);

// 📝 تحديث حالة طلب السحب (موافقة/رفض)
router.patch("/admin/withdraw-requests/:requestId", walletController.updateWithdrawStatus);

module.exports = router;
