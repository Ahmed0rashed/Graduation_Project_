const express = require('express');
const router = express.Router();
const authController = require('../controllers/RadiologyCenterAuth.controller');

// router.post('/registerPatient', authController.registerPatient);
// router.get('/loginPatient', authController.loginPatient);


// router.get('/loginRadiologist', authController.loginRadiologist);
// router.post('/registerRadiologist', authController.registerRadiologist);

router.post("/registerRadiologyCenter",authController.registerRadiologyCenter);
router.get("/loginRadiologyCenter",authController.loginRadiologyCenter);



module.exports = router;
