const express = require("express");
const router = express.Router();
const CenterRadiologistsRelationController = require("../controllers/CenterRadiologistsRelation.Controller");

router.get("/radiologists/:centerId", CenterRadiologistsRelationController.getRadiologistsByCenterId);
router.post('/radiologists/:centerId', CenterRadiologistsRelationController.addRadiologistToCenter);

router.get("/onlineRadiologists/:centerId", CenterRadiologistsRelationController.getOnlineRadiologistsByCenterId);
router.get("/radiologistsList/:centerId", CenterRadiologistsRelationController.getRadiologistsByCenterId1);
router.get("/centers/:radiologistId", CenterRadiologistsRelationController.getCentersByRadiologistId);

module.exports = router;