const express = require('express');
const router = express.Router();
const multer = require('multer');
const authController = require('../controllers/RadiologistAuth.controller');


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
router.post('/sendOtp', authController.sendOtp);
router.post('/verifyOtp', authController.verifyOtp);

// Password recovery routes
router.post('/forgotPassword', authController.forgotPassword);
router.post('/resetPassword', authController.resetPassword);

module.exports = router;
