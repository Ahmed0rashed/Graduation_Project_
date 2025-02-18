const express = require('express');
const router = express.Router();
const authController = require('../controllers/RadiologistAuth.controller');



router.post('/loginRadiologist', authController.loginRadiologist);
router.post('/registerRadiologist', authController.registerRadiologist);
router.post('/sendOtp', authController.sendOtp);
router.post('/verifyOtp', authController.verifyOtp);
router.post('/forgotPassword', authController.forgotPassword);
router.post('/resetPassword', authController.resetPassword);



module.exports = router;
