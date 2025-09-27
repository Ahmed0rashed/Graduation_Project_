

const express = require('express');
const router = express.Router();
const multer = require("multer");
const RadiologistController = require('../controllers/Radiologist.Controller');
// Rate limiters disabled
// const { uploadLimiter } = require("../middleware/rateLimiter");

const { uploadImage } = require("../controllers/Radiologist.Controller");
const uploadImag = require("../controllers/Radiologist.Controller");
const storage = multer.memoryStorage();
const fileUpload = multer({ storage: storage });

router.get('/getRadiologistById/:id', RadiologistController.getRadiologistById);
router.delete('/deleteRadiologistById/:id', RadiologistController.deleteRadiologist);
router.put('/updateRadiologist/:id', RadiologistController.updateRadiologist);
router.patch('/editRadiologist/:id', RadiologistController.editRadiologist);

router.post("/upload/:id", fileUpload.single("image"), uploadImage);
router.get("/getImage/:id", uploadImag.getImage);

module.exports = router;