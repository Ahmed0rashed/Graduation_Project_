const axios = require("axios");
const Center = require("../models/Radiology_Centers.Model");
const Radiologist = require("../models/Radiologists.Model");
const Payment = require("../models/payment/Payment.Model");
const Wallet = require("../models/payment/Wallet.Model");
const WithdrawalRequest = require("../models/payment/WithdrawRequest.Model");
const sendNotification = require("../utils/sendNotification");
const WalletTransactionModel = require("../models/payment/WalletTransaction.Model");
const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });



const BASE_URL = "https://accept.paymob.com/api";
const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY
const INTEGRATION_ID = process.env.PAYMOB_INTEGRATION_ID
const IFRAME_ID = process.env.PAYMOB_IFRAME_ID
const ADMIN_ID = process.env.PAYMOB_ADMIN_ID
exports.initiatePayment = async (req, res) => {
  try {
    const { amountCents, billing_data, centerId } = req.body;

    // Step 1: Auth Token
    const auth = await axios.post(`${BASE_URL}/auth/tokens`, {
      api_key: PAYMOB_API_KEY,
    });
    const token = auth.data.token;

    // Step 2: Create Order
    const order = await axios.post(`${BASE_URL}/ecommerce/orders`, {
      auth_token: token,
      delivery_needed: false,
      amount_cents: amountCents,
      currency: "EGP",
      items: [],
    });

    const orderId = order.data.id;

    // Step 3: Payment Key
    const paymentKey = await axios.post(`${BASE_URL}/acceptance/payment_keys`, {
      auth_token: token,
      amount_cents: amountCents,
      expiration: 3600,
      order_id: orderId,
      currency: "EGP",
      integration_id: INTEGRATION_ID,
      billing_data,
    });

    const iframeURL = `https://accept.paymob.com/api/acceptance/iframes/${IFRAME_ID}?payment_token=${paymentKey.data.token}`;
    console.log(iframeURL);
    // Save payment record
    await Payment.create({
      centerId,
      amountCents,
      currency: "EGP",
      billingData: billing_data,
      paymobOrderId: orderId,
      iframeUrl: iframeURL,
      status: "pending",       // سيتم تحديثه لاحقًا بعد التأكيد
      method: "Paymob"
    });


    // Notify Admin
    await sendNotification({
      userId: ADMIN_ID,
      userType: "Admin",
      title: "new payment order",
      message: `The center has made a payment of ${amountCents / 100} pounds and is awaiting confirmation.`,
      type: "payments"
    });
    await WalletTransactionModel.create({
      userId: centerId,             // متوافق مع الـ schema
      userType: "RadiologyCenter",         // enum قيمته صحيحة الآن
      type: "credit",
      amount: amountCents / 100,
      reason: `The center has made a payment of ${amountCents / 100} pounds and is awaiting confirmation.`
    });
    res.status(200).json({
      message: "Payment link generated",
      iframeURL,
      orderId,
    });

  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({
      message: `Faild  Process ${err.response?.data || err.message}`,
    });
  }
};


exports.confirmPayment = async (req, res) => {
  try {
    const { paymobOrderId } = req.params;

    // 1. هات عملية الدفع
    const payment = await Payment.findOne({ paymobOrderId: String(paymobOrderId) });
    console.log(payment);
    if (!payment) return res.status(404).json({ message: "عملية الدفع غير موجودة" });
    if (payment.status === "confirmed") return res.status(400).json({ message: "تم تأكيد الدفع بالفعل" });

    // 2. أضف المبلغ لمحفظة السنتر
    const wallet = await Wallet.findOneAndUpdate(
      { ownerId: payment.centerId, ownerType: "RadiologyCenter" },
      { $inc: { balance: payment.amountCents / 100 } },
      { new: true, upsert: true }
    );

    // 3. حدّث حالة الدفع
    payment.status = "confirmed";
    await payment.save();

    // 4. إشعار للسنتر
    await sendNotification({
      userId: payment.centerId.toString(),
      userType: "RadiologyCenter",
      title: "تم تأكيد الدفع",
      message: `تم تأكيد الدفع بنجاح، وتم إضافة ${payment.amountCents / 100} جنيه إلى محفظتك.`,
      type: "paymeents"
    });

    res.status(200).json({
      message: "تم تأكيد الدفع بنجاح",
      walletBalance: wallet.balance
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "خطأ أثناء تأكيد الدفع" });
  }
};


exports.creditDoctorAfterReport = async (req, res) => {
  try {
    const { doctorId, reportPrice, recordId } = req.body;


    // 1. تحديث المحفظة
    const wallet = await Wallet.findOneAndUpdate(
      { ownerId: doctorId, ownerType: "Radiologist" },
      { $inc: { balance: reportPrice } },
      { new: true, upsert: true }
    );

    // 2. إرسال إشعار
    await sendNotification({
      userId: doctorId,
      userType: "Radiologist",
      title: "رصيد جديد",
      message: `تم إضافة ${reportPrice} جنيه إلى محفظتك مقابل إنهاء تقرير.`,
      type: "report_payment"
    });

    res.status(200).json({
      message: "تم إضافة الرصيد بنجاح",
      walletBalance: wallet.balance,
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "فشل في إضافة الرصيد للدكتور" });
  }
};


// دكتور بيطلب سحب رصيد
exports.requestWithdrawal = async (req, res) => {
  try {
    const { doctorId, amount } = req.body;

    const wallet = await Wallet.findOne({ ownerId: doctorId, ownerType: "Radiologist" });

    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ message: "الرصيد غير كافي" });
    }

    const request = await WithdrawalRequest.create({
      doctorId,
      amount,
    });

    // إشعار للأدمن
    await sendNotification({
      userId: "ADMIN_ID", // لو عندك أكتر من أدمن خليه يروح لكلهم أو تسجله كـ ثابت
      userType: "Admin",
      title: "طلب سحب جديد",
      message: `الدكتور طلب سحب مبلغ ${amount} جنيه.`,
      type: "withdrawal_request"
    });

    res.status(200).json({ message: "تم إرسال طلب السحب بنجاح", request });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "فشل في إرسال طلب السحب" });
  }
};
exports.approveWithdrawal = async (req, res) => {
  try {
    const { requestCode } = req.params;
    const { id, type, amount } = req.body;

    // 1. جلب الطلب
    const request = await WithdrawalRequest.findOne({ code: requestCode });
    if (!request || request.status !== "pending") {
      return res.status(404).json({ message: "الطلب غير صالح أو تم تنفيذه بالفعل" });
    }

    // 2. التحقق من المحفظة والرصيد
    const wallet = await Wallet.findOne({
      ownerId: id,
      ownerType: type
    });

    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ message: "الرصيد غير كافي" });
    }

    // 3. خصم المبلغ من المحفظة
    wallet.balance -= amount;
    await wallet.save();

    // 4. تحديث حالة الطلب
    request.status = "approved";
    request.processedAmount = amount;
    await request.save();

    // 5. إرسال إشعار
    await sendNotification({
      userId: id,
      userType: type,
      title: "تمت الموافقة على السحب",
      message: `تم تحويل مبلغ ${amount} جنيه بنجاح.`,
      type: "withdrawal_approved"
    });

    // 6. (اختياري) تحويل فعلي من Paymob (live mode)

    const payout = await axios.post('https://paymob.com/api/payouts', {
      destination: 'رقم الحساب/المحفظة',
      amount_cents: amount * 100,
      currency: 'EGP',
      description: 'Withdrawal payout'
    }, {
      headers: { Authorization: `Bearer ${process.env.PAYMOB_LIVE_TOKEN}` }
    });


    res.status(200).json({
      message: "تمت الموافقة على السحب وتم خصم المبلغ",
      walletBalance: wallet.balance
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "فشل في تنفيذ السحب" });
  }
};

exports.getAllWithdrawals = async (req, res) => {
  try {
    const requests = await WithdrawRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
