const express = require("express");
const router = express.Router();
const CenterRadiologistsRelationController = require("../controllers/CenterRadiologistsRelation.Controller");

router.get("/radiologists/:centerId", CenterRadiologistsRelationController.getRadiologistsByCenterId);
router.post('/radiologists/:centerId', CenterRadiologistsRelationController.addRadiologistToCenter);
router.post('/radiologist/:centerId/:id', CenterRadiologistsRelationController.addRadiologistToCenter1);

router.get("/onlineRadiologists/:centerId", CenterRadiologistsRelationController.getOnlineRadiologistsByCenterId);
router.get("/radiologistsList/:centerId", CenterRadiologistsRelationController.getRadiologistsByCenterId1);
router.get("/centers/:radiologistId", CenterRadiologistsRelationController.getCentersByRadiologistId);
router.delete("/removeRadiologistFromCenter/:centerId", CenterRadiologistsRelationController.removeRadiologistFromCenter);
router.post("/sendEmailToRadiologist/:centerId", CenterRadiologistsRelationController.sendEmailToRadiologist);


module.exports = router;