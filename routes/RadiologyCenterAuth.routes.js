const express = require('express');
const router = express.Router();
const authController = require('../controllers/RadiologyCenterAuth.controller');

// router.post('/registerPatient', authController.registerPatient);
// router.get('/loginPatient', authController.loginPatient);


// router.get('/loginRadiologist', authController.loginRadiologist);
// router.post('/registerRadiologist', authController.registerRadiologist);

router.post("/registerRadiologyCenter",authController.registerRadiologyCenter);
router.post("/loginRadiologyCenter",authController.loginRadiologyCenter);
router.post('/verifyOtp', authController.verifyOtp);
router.post('/SendEmail', authController.SendEmail);
router.post('/forgotPassword', authController.forgotPassword);
router.post('/resetPassword', authController.resetPassword);



module.exports = router;
