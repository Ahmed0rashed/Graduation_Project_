const express = require("express");
const router = express.Router();

const paymentController = require("../controllers/payment.controller");

router.post("/initiate", paymentController.initiatePayment);
router.patch("/confirm/:paymobOrderId", paymentController.confirmPayment);
router.post("/credit-doctor", paymentController.creditDoctorAfterReport);
router.post("/withdrawal-request", paymentController.requestWithdrawal);
router.patch("/approve-withdrawal/:requestId", paymentController.approveWithdrawal);
router.get("/withdrawals", paymentController.getAllWithdrawals);


module.exports = router;
