const express = require('express');
const router = express.Router();
const authController = require('../controllers/RadiologyRecored.controller');
 
router.post('/addRecord', authController.addRecord);



module.exports = router;
