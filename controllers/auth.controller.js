const Patient = require("../models/Patients.model");
const Radiologist = require("../models/Radiologists.model");
const RadiologyCenter = require("../models/Radiology_Centers.Model");  // تأكد من اسم الملف هنا
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const validator = require("validator");
const { createToken } = require("../utils/createToken");

// Middleware to check authentication using JWT token
const isAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "Token is missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const patient = await Patient.findOne({ _id: decoded.id });
    if (!patient) {
      throw new Error("No patient found with this ID");
    }

    req.patient = patient;
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Please authenticate", error: error.message });
  }
};
// Register Radiology Center
exports.registerRadiologyCenter = async (req, res) => {
  try {
    const { centerName, address, contactNumber, email, password } = req.body;

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ message: "A valid email is required" });
    }
    if (!centerName) {
      return res.status(400).json({ message: "Center name is required" });
    }
    if (!address) {
      return res.status(400).json({ message: "Address is required" });
    }
    if (!contactNumber || !/^\+?[\d\s-]{10,15}$/.test(contactNumber)) {
      return res.status(400).json({ message: "A valid contact number is required" });
    }
    if (!password) {
      return res.status(400).json({ message: "A valid password is required" });
    }
    if (await RadiologyCenter.findOne({ email })) {
      return res.status(400).json({ message: `This email "${email}" already exists` });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newRadiologyCenter = new RadiologyCenter({
      centerName,
      address,
      contactNumber,
      email,
      passwordHash: hashedPassword,
    });

    await newRadiologyCenter.save();
    const token = createToken(newRadiologyCenter._id);

    res.status(201).json({ token, radiologyCenter: newRadiologyCenter });
  } catch (error) {
    console.error(`Error registering radiology center: ${error}`);
    res.status(500).json({ message: "Error registering radiology center", error });
  }
};

// Radiology Center Login
exports.loginRadiologyCenter = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ message: "A valid email is required" });
    }
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const radiologyCenter = await RadiologyCenter.findOne({ email: email.toLowerCase() });
    if (!radiologyCenter) {
      return res.status(404).json({ message: "No radiology center found with this email" });
    }

    const isMatch = await bcrypt.compare(password, radiologyCenter.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = createToken(radiologyCenter._id);
    res.status(200).json({ token, radiologyCenter });
  } catch (error) {
    console.error("Error logging in radiology center: ", error);
    res.status(500).json({ message: "Error logging in radiology center", error: error.message });
  }
};
