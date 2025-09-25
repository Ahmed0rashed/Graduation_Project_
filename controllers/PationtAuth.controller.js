const Patient = require("../models/Patients.model");
const bcrypt = require("bcrypt");
const validator = require("validator");
const { createToken } = require("../utils/createToken");  
const passport = require('../config/passport');
const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });


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


exports.registerPatient = async (req, res) => {
  try {
    const { firstName, lastName, dateOfBirth, gender, email, password, nationalId, contactNumber, address, medicalHistory, emergencyContact } = req.body;

    // Validation
    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ message: "A valid email is required" });
    }
    if (!firstName) {
      return res.status(400).json({ message: "First name is required" });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Check if email already exists
    if (await Patient.findOne({ email: email.toLowerCase() })) {
      return res.status(400).json({ message: `This email "${email}" already exists` });
    }

    // Check if nationalId already exists (if provided)
    if (nationalId && await Patient.findOne({ nationalId })) {
      return res.status(400).json({ message: `National ID "${nationalId}" already exists` });
    }

   if (nationalId && !/^[A-Z0-9]{10,14}$/.test(nationalId)) {
    return res.status(400).json({ message: `National ID not valid` });
  }

    if (contactNumber && await Patient.findOne({ contactNumber })) {
      return res.status(400).json({ message: `Contact number "${contactNumber}" already exists` });
    }


    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create patient object
    const patientData = {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      email: email.toLowerCase(),
      passwordHash: hashedPassword,
      contactNumber,
    };

    // Only add nationalId if it's provided and valid
    if (nationalId && nationalId.trim() !== '') {
      patientData.nationalId = nationalId;
    }

    const newPatient = new Patient(patientData);

    // Save patient
    await newPatient.save();

    // Create token
    const token = createToken(newPatient._id);

    // Return response (remove passwordHash from response)
    const patientResponse = newPatient.toObject();
    delete patientResponse.passwordHash;

    res.status(201).json({ 
      success: true,
      message: "Patient registered successfully",
      token, 
      patient: patientResponse 
    });
  } catch (error) {
    console.error("Error registering patient: ", error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        success: false,
        message: `Duplicate ${field} found`,
        error: `This ${field} already exists` 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "Error registering patient", 
      error: error.message 
    });
  }
};


exports.Link = (req, res) => {
  const rootUrl = process.env.NODE_ENV === "production" ? process.env.PRODUCTION_URL : process.env.DEVELOPMENT_URL;
  const link = `${rootUrl}/api/patientAuth/withgoogle`;
  res.json({ link });
};

exports.signWithGoogle = (req, res, next) => {
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })(req, res, next);
};

exports.GoogleCallback = (req, res, next) => {
  passport.authenticate("google", async (err, patient, info) => {
    if (err) {
      console.error("Authentication Error:", err);
      return res.redirect("/api/patientAuth/failure");
    }

    if (!patient) {
      console.log("No user found:", info);
      return res.redirect("/api/patientAuth/failure");
    }

    const token = createToken(patient._id);
    res.json({ token, patient });
  })(req, res, next);
};



exports.Failure = (req, res) => {
  res.status(401).json({ message: "Failed to authenticate with Google", error: req.query.error });
};

