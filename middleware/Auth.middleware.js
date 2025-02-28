require("dotenv").config();
const jwt = require("jsonwebtoken");
const Radiologist = require("../models/Radiologists.Model");
const RadiologyCenter = require("../models/Radiology_Centers.Model");

const secretKey = process.env.JWT_SECRET || "123"; 

exports.authenticateUser = async (req, res, next) => {
  try {

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, secretKey);

    const user = await Radiologist.findById(decoded.id) || await RadiologyCenter.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = { id: user._id };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
      error: error.message,
    });
  }
};
