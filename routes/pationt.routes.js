const express = require('express');
const router = express.Router();
const userController = require('../controllers/pationt.controller');



router.post('/addPatient', userController.addPatient);
router.get('/getPatients', userController.getAllPatients);
router.get("/getPatientStatistics", userController.getPatientStatistics);// get patient statistics from the database




module.exports = router;
