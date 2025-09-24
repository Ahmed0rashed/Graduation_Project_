const express = require('express');
const router = express.Router();
const multer = require('multer');
const authController = require('../controllers/RadiologistAuth.controller');
const { passwordResetLimiter, otpLimiter, strictLimiter } = require('../middleware/rateLimiter');


const storage = multer.memoryStorage();
const fileUpload = multer({ storage });


router.post('/login', authController.login);


router.post(
  '/registerRadiologist',
  fileUpload.fields([
    { name: 'frontId', maxCount: 1 },
    { name: 'backId', maxCount: 1 },
  ]),
  (req, res, next) => {
    if (req.files) {
      req.frontId = req.files.frontId?.[0];
      req.backId = req.files.backId?.[0];
    }
    next();
  },
  authController.registerRadiologist
);

// OTP-related routes
router.post('/sendOtp', otpLimiter, authController.sendOtp);
router.post('/verifyOtp', strictLimiter, authController.verifyOtp);

// Password recovery routes
router.post('/forgotPassword', passwordResetLimiter, authController.forgotPassword);
router.post('/resetPassword', strictLimiter, authController.resetPassword);

module.exports = router;
