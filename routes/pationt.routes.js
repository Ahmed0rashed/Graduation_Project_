const express = require('express');
const router = express.Router();
const userController = require('../controllers/pationt.controller');



router.post('/addPatient', userController.addPatient);
router.get('/getPatients', userController.getAllPatients);
router.get("/getPatientStatistics", userController.getPatientStatistics);
router.get("/getPatientByNationalId/:nationalId", userController.getPatientByNationalId);
router.post("/addRecordToPatient/:patientId", userController.addRecordToPatient);
router.get('/getPatientRecords/:patientId', userController.getPatientRecords);


module.exports = router;
