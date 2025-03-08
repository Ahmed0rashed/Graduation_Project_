const express = require('express');
const router = express.Router();
const RadiologistController = require('../controllers/Radiologist.Controller');


router.get('/getRadiologistById/:id', RadiologistController.getRadiologistById);


router.patch('/editRadiologist/:id', RadiologistController.editRadiologist);
// ✅ تحديث صورة الطبيب
router.patch("/editImageRadiologist/:id",
  RadiologistController.upload.single("image"),
  RadiologistController.updateRadiologistImage);
module.exports = router;