const express = require('express');
const router = express.Router();
const RadiologistController = require('../controllers/Radiologist.Controller');


router.patch('/getRadiologistById/:id', RadiologistController.getRadiologistById);


router.patch('/editRadiologist/:id', RadiologistController.editRadiologist);

module.exports = router;