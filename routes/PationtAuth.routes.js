const express = require('express');
const router = express.Router();
const authController = require('../controllers/PationtAuth.controller');

router.post('/registerPatient', authController.registerPatient);
router.post('/loginPatient', authController.loginPatient);
router.get('/lik', authController.Link);
router.get('/signWithGoogle', authController.signWithGoogle);
router.get('/google/callback', authController.GoogleCallback);
router.get('/failure', authController.Failure);

// router.get('/loginRadiologist', authController.loginRadiologist);
// router.post('/registerRadiologist', authController.registerRadiologist);

// router.post("/registerRadiologyCenter",authController.registerRadiologyCenter);
// router.get("/loginRadiologyCenter",authController.loginRadiologyCenter);



module.exports = router;
