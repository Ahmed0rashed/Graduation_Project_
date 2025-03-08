const express = require('express');
const router = express.Router();
const RadiologistController = require('../controllers/Radiologist.Controller');


router.get('/getRadiologistById/:id', RadiologistController.getRadiologistById);
router.delete('/deleteRadiologistById/:id', RadiologistController.deleteRadiologist);
router.put('/updateRadiologist/:id', RadiologistController.updateRadiologist);
router.patch('/editRadiologist/:id', RadiologistController.editRadiologist);

module.exports = router;