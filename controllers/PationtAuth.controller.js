const Patient = require("../models/Patients.model");
const bcrypt = require("bcrypt");
const validator = require("validator");
const { createToken } = require("../utils/createToken");  
const passport = require('../config/passport');


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
    const { firstName, lastName, dateOfBirth, gender, email, password } = req.body;


    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ message: "A valid email is required" });
    }
    if (!firstName) {
      return res.status(400).json({ message: "First name is required" });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }


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

