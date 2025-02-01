const Patient = require("../models/Patients.model");
const bcrypt = require("bcrypt");
const validator = require("validator");
const { createToken } = require("../utils/createToken");  // Utility function to create token

// Patient Login
exports.loginPatient = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find patient by email
    const patient = await Patient.findOne({ email: email.toLowerCase() });
    if (!patient) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, patient.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate a token
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

    // Validate input
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

    // Check if the email already exists
    if (await Patient.findOne({ email: email.toLowerCase() })) {
      return res.status(400).json({ message: `This email "${email}" already exists` });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new patient
    const newPatient = new Patient({
      firstName,
      lastName,
      dateOfBirth,
      gender,
      email: email.toLowerCase(),
      passwordHash: hashedPassword,
    });

    // Save new patient
    await newPatient.save();

    // Generate a token
    const token = createToken(newPatient._id);

    // Respond with token and patient data
    res.status(201).json({ token, patient: newPatient });
  } catch (error) {
    console.error("Error registering patient: ", error);
    res.status(500).json({ message: "Error registering patient", error: error.message });
  }
};
