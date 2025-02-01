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

// Patient Login
exports.loginPatient = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const patient = await Patient.findOne({ email: email.toLowerCase() });
    if (!patient) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, patient.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = createToken(patient._id);
    res.status(200).json({ token, patient });
  } catch (error) {
    console.error("Error logging in: ", error);
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
};

// Patient Registration
exports.registerPatient = async (req, res) => {
  try {
    const { firstName, lastName, dateOfBirth, gender, email, password } = req.body;

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ message: "A valid email is required" });
    }
    if (!firstName || !lastName) {
      return res.status(400).json({ message: "First name and last name are required" });
    }
    if (!dateOfBirth) {
      return res.status(400).json({ message: "Date of birth is required" });
    }
    if (!gender || !["Male", "Female"].includes(gender)) {
      return res.status(400).json({ message: "A valid gender is required" });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Check if the email already exists in the database
    if (await Patient.findOne({ email: email.toLowerCase() })) {
      return res.status(400).json({ message: `This email "${email}" already exists` });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newPatient = new Patient({
      firstName,
      lastName,
      dateOfBirth,
      gender,
      email: email.toLowerCase(),
      passwordHash: hashedPassword,
    });

    await newPatient.save();
    const token = createToken(newPatient._id);

    res.status(201).json({ token, patient: newPatient });
  } catch (error) {
    console.error("Error registering patient: ", error);
    res.status(500).json({ message: "Error registering patient", error: error.message });
  }
};

// Radiologist Login
exports.loginRadiologist = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ message: "A valid email is required" });
    }
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const radiologist = await Radiologist.findOne({ email: email.toLowerCase() });
    if (!radiologist) {
      return res.status(404).json({ message: "No radiologist found with this email" });
    }

    const isMatch = await bcrypt.compare(password, radiologist.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = createToken(radiologist._id);
    res.status(200).json({ token, radiologist });
  } catch (error) {
    console.error("Error logging in radiologist: ", error);
    res.status(500).json({ message: "Error logging in radiologist", error: error.message });
  }
};

// Radiologist Registration
exports.registerRadiologist = async (req, res) => {
  try {
    const { firstName, lastName, specialization, email, password, contactNumber } = req.body;

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ message: "A valid email is required" });
    }
    if (!firstName || !lastName) {
      return res.status(400).json({ message: "First name and last name are required" });
    }
    if (!specialization || !Radiologist.schema.path('specialization').enumValues.includes(specialization)) {
      return res.status(400).json({ message: "A valid specialization is required" });
    }
    if (!contactNumber || !/^\+?[\d\s-]{10,15}$/.test(contactNumber)) {
      return res.status(400).json({ message: "A valid contact number is required" });
    }
    if (!password) {
      return res.status(400).json({ message: "A valid password is required" });
    }
    if (await Radiologist.findOne({ email })) {
      return res.status(400).json({ message: `This email "${email}" already exists` });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newRadiologist = new Radiologist({
      firstName,
      lastName,
      specialization,
      email,
      passwordHash: hashedPassword,
      contactNumber,
    });

    await newRadiologist.save();
    const token = createToken(newRadiologist._id);

    res.status(201).json({ token, radiologist: newRadiologist });
  } catch (error) {
    console.error(`Error registering radiologist: ${error}`);
    res.status(500).json({ message: "Error registering radiologist", error });
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
