const express = require('express');
const router = express.Router();
const authController = require('../controllers/RadiologyRecored.controller');
 
router.post('/addRecord', authController.addRecord);
router.get('/getRecordsByCenterId/:id', authController.getRecordsByCenterId);
router.get('/getRecordById/:id', authController.getRecordById);
router.delete('/deleteRecordById/:id', authController.deleteRecordById);
router.delete('/getNumberOfRecords/:id', authController.getNumberOfRecords);




module.exports = router;
