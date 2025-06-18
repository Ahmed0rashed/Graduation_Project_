const express = require('express');
const router = express.Router();
const recordController =  require('../controllers/RadiologyRecored.controller');


router.get('/getAllRecords', recordController.getAllRecords);
router.get('/getOneRecordById/:id', recordController.getOneRecordById);
router.get("/getAllRecords/status/:status/:id", recordController.getAllRecordsByStatus);
router.get('/getRecordsByRadiologistId/:id', recordController.getRecordsByRadiologistId);
router.get('/getRecordsByCenterId/:id', recordController.getRecordsByCenterId);

router.post('/addRecord', recordController.addRecord);
router.put('/updateRecordById/:id', recordController.updateRecordById);

router.delete('/deleteRecordById/:id', recordController.deleteRecordById);
router.delete('/realDeleteRecordById/:id', recordController.realDeleteRecordById);
router.post('/cancel/:id/:radiologistId?',recordController.cancel);
router.post('/toggleFlag/:id',recordController.toggleFlag);
router.post('/redirectToOurRadiologist/:recordId', recordController.redirectToOurRadiologist);
router.post('/sendEmailToRadiologist/:recoredId', recordController.sendEmailToRadiologist);
router.post('/extendStudyDeadline/:recordId', recordController.extendStudyDeadline);
router.post('/approve/:recordId', recordController.Approve);
router.post('/addPhoneNumberToRecord/:recordId', recordController.addPhoneNumberToRecord);
module.exports = router;
