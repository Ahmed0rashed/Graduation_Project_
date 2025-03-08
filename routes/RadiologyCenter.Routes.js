const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = require("../middleware/upload");
const { uploadImage } = require("../controllers/RadiologyCenter.Controller");
const uploadImag = require("../controllers/RadiologyCenter.Controller");
const RadiologyCenterController = require("../controllers/RadiologyCenter.Controller");

const storage = multer.memoryStorage();
const fileUpload = multer({ storage: storage });

router.post("/upload/:id", fileUpload.single("image"), uploadImage);
router.get("/getImage/:id", uploadImag.getImage);
router.get("/getAllCenters", RadiologyCenterController.getAllCenters);
router.get("/getCenterById/:id", RadiologyCenterController.getCenterById);
router.post("/createCenter", RadiologyCenterController.createCenter);

module.exports = router;
