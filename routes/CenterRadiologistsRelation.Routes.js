const express = require("express");
const router = express.Router();
const CenterRadiologistsRelationController = require("../controllers/CenterRadiologistsRelation.Controller");

router.get("/radiologists/:centerId", CenterRadiologistsRelationController.getRadiologistsByCenterId);
router.post('/radiologists/:centerId', CenterRadiologistsRelationController.addRadiologistToCenter);

module.exports = router;