const express = require('express');
const router = express.Router();
const userController = require('../controllers/AIReports.controller');



router.post('/addAIReport', userController.createAIReport);
router.get('/getAllAIReports', userController.getAllAIReports);
router.get('/getOneAIReport/:id', userController.getOneAIReport);
router.put('/updateAIReport/:id', userController.UpdateAIReport);
router.delete('/deleteAIReport/:id', userController.deleteAIReport);



module.exports = router;
