const express = require('express');
const router = express.Router();
const RadiologistController = require('../controllers/Radiologist.Controller');

//Get all radiologists with filters and pagination
router.patch('/getRadiologistById/:id', RadiologistController.getRadiologistById);

module.exports = router;