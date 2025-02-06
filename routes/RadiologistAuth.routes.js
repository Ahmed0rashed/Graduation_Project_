const express = require('express');
const router = express.Router();
const authController = require('../controllers/RadiologistAuth.controller');

// router.post('/registerPatient', authController.registerPatient);
// router.get('/loginPatient', authController.loginPatient);


router.post('/loginRadiologist', authController.loginRadiologist);
router.post('/registerRadiologist', authController.registerRadiologist);
router.post('/sendOtp', authController.sendOtp);
router.post('/verifyOtp', authController.verifyOtp);
// router.post("/registerRadiologyCenter",authController.registerRadiologyCenter);
// router.get("/loginRadiologyCenter",authController.loginRadiologyCenter);



module.exports = router;
