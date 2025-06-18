const express = require("express");
const router = express.Router();
const authController = require("../controllers/RadiologyCenterAuth.controller");
const { verifyOtp } = require("../controllers/RadiologyCenterAuth.controller");
const multer = require("multer");
const upload = require("../middleware/upload");

const storage = multer.memoryStorage();
const fileUpload = multer({ storage: storage });

router.post("/registerRadiologyCenter", authController.registerRadiologyCenter);
router.post("/loginRadiologyCenter", authController.loginRadiologyCenter);
router.post(
  "/verify-otp/:email/:otp/:password/:centerName/:contactNumber/:zipCode/:street/:city/:state",
  fileUpload.single("path"),
  verifyOtp
);
router.post("/SendEmail", authController.SendEmail);
router.post("/forgotPassword", authController.forgotPassword);
router.post("/resetPassword", authController.resetPassword);
router.post('/checkOtp', authController.checkOtp);


module.exports = router;
