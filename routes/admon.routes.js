const express = require("express");
const router = express.Router();
const  Admincontroller = require("../controllers/admin.controller");
// const { verifyToken } = require("../middleware/auth.middleware");

// radiologist
router.post("/addRadiologist", Admincontroller.addRadiologist);

router.get("/getRadiologists", Admincontroller.getRadiologists);

router.delete("/removeRadiologist/:id", Admincontroller.removeRadiologist);    

router.put("/updateRadiologist/:id", Admincontroller.updateRadiologist);

router.get("/getRadiologist/:id", Admincontroller.getRadiologistbyId);

// radiology center
router.post("/addRadiologyCenter", Admincontroller.addRadiologyCenter);

router.get("/getApprovedRadiologyCenters", Admincontroller.getApprovedRadiologyCenters);

router.get("/getNotApprovedRadiologyCenters", Admincontroller.getNotApprovedRadiologyCenters);

router.post("/approveRadiologyCenter/:centerId", Admincontroller.approveRadiologyCenter);

router.delete("/removeRadiologyCenter/:centerId", Admincontroller.removeRadiologyCenter);

router.put("/updateRadiologyCenter/:centerId", Admincontroller.updateRadiologyCenter);

router.get("/getRadiologyCenter/:centerId", Admincontroller.getRadiologyCenterById);



module.exports = router;
