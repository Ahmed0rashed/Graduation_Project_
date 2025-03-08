

const express = require('express');
const router = express.Router();
const multer = require("multer");
const RadiologistController = require('../controllers/Radiologist.Controller');
const { uploadImage } = require("../controllers/Radiologist.Controller");
const uploadImag = require("../controllers/Radiologist.Controller");
const storage = multer.memoryStorage();
const fileUpload = multer({ storage: storage });

router.get('/getRadiologistById/:id', RadiologistController.getRadiologistById);

router.get('/editRadiologist/:id', RadiologistController.editRadiologist);

router.post("/upload/:id", fileUpload.single("image"), uploadImage);
router.get("/getImage/:id", uploadImag.getImage);
module.exports = router;