const express = require('express');
const router = express.Router();
const authController =  require('../controllers/RadiologyRecored.controller');


router.get('/getAllRecords', authController.getAllRecords);
router.get('/getOneRecordById/:id', authController.getOneRecordById);
router.get("/getAllRecords/status/:status/:id", authController.getAllRecordsByStatus);
router.get('/getRecordsByRadiologistId/:id', authController.getRecordsByRadiologistId);
router.get('/getRecordsByCenterId/:id', authController.getRecordsByCenterId);

router.post('/addRecord', authController.addRecord);
router.put('/updateRecordById/:id', authController.updateRecordById);

router.delete('/deleteRecordById/:id', authController.deleteRecordById);
router.delete('/realDeleteRecordById/:id', authController.realDeleteRecordById);
router.post('/cancel/:id',authController.cancel);
router.post('/toggleFlag/:id',authController.toggleFlag);







module.exports = router;
