const express = require('express');
const router = express.Router();
const userController = require('../controllers/pationt.controller');

router.post('/addPatient', userController.addPatient);
router.get('/getPatients', userController.getAllPatients);

module.exports = router;
