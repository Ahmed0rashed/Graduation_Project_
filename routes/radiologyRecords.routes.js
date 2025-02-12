const express = require('express');
const router = express.Router();
const authController = require('../controllers/RadiologyRecored.controller');
 
router.post('/addRecord', authController.addRecord);
router.get('/getRecordById/:id', authController.getRecordById);
router.delete('/deleteRecordById/:id', authController.deleteRecordById);
router.get('/getNumberOfRecordsByCenterId/:id', authController.getNumberOfRecords);
router.get('/getRecordsByCenterId/:id', authController.getRecordsByCenterId);
router.get('/getRecordsByRediologyId/:id', authController.getRecordsByRediologyId);



module.exports = router;
