const express = require("express");
const router = express.Router();
const userController = require("../controllers/AIReports.controller");
//besic routes
router.post("/addAIReport", userController.createAIReport);
router.get("/getOneAIReport/:id", userController.getOneAIReport);
router.put("/updateAIReport/:id", userController.updateAIReport);
router.delete("/deleteAIReport/:id", userController.deleteAIReport);
// routes with options
router.get(
  "/getAllAIReports/result/:result",
  userController.getAllAIReportsByResult
);

module.exports = router;
