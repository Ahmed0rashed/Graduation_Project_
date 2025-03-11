const express = require("express");
const router = express.Router();
const userController = require("../controllers/AIReports.controller");
//besic routes
router.post("/addAIReport", userController.createAIReport);
router.get("/getOneAIReport/:id", userController.getOneAIReport);
router.put("/updateAIReport/:id", userController.updateAIReport);
router.delete("/deleteAIReport/:id", userController.deleteAIReport);
router.post("/analyzeImage/:id", userController.analyzeImage);
router.post("/analyzeFindings/:id", userController.analyzeFindings);
router.post("/analyzeImpression/:id", userController.analyzeImpression);
router.post("/analyzeComments/:id", userController.analyzeComments);
router.put("/Reviewed/:id", userController.updateAIReport1);


// routes with options
router.get(
  "/getAllAIReports/result/:result",
  userController.getAllAIReportsByResult
);
module.exports = router;
