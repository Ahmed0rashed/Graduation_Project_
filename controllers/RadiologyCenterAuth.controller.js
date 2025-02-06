const RadiologyCenter = require("../models/Radiology_Centers.Model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const validator = require("validator");
const { createToken } = require("../utils/createToken");
const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");
const Otp = require("../models/OTP");

// Helper function to send OTP email
const sendOtpEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "ahmedmohamedrashed236@gmail.com",
      pass: "ncjb nwhz gtcn rqrw",
    },
  });

  const mailOptions = {
    from: "ahmedmohamedrashed236@gmail.com",
    to: email,
    subject: "OTP Verification",
    text: `Your OTP is: ${otp}. It is valid for 5 minutes.`,
  };

  return transporter.sendMail(mailOptions);
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
      return res.status(400).json({ message: "Password is required" });
    }
    if (await RadiologyCenter.findOne({ email })) {
      return res.status(400).json({ message: `This email "${email}" already exists` });
    }

    // Send OTP for verification
    const otp = otpGenerator.generate(6, { upperCase: false, specialChars: false });
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 5);

    const otpRecord = await Otp.findOneAndUpdate(
      { email: email.toLowerCase() },
      { otp, expiry },
      { upsert: true, new: true }
    );

    await sendOtpEmail(email, otp);

    return res.status(200).json({ message: "OTP sent to email. Please verify to complete registration." });

  } catch (error) {
    console.error(`Error registering radiology center: ${error}`);
    res.status(500).json({ message: "Error registering radiology center", error });
  }
};

// OTP verification and completing the registration
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp, password, centerName, address, contactNumber } = req.body;

    const otpRecord = await Otp.findOne({ email: email.toLowerCase() });
    if (!otpRecord) {
      return res.status(400).json({ message: "OTP not found for this email" });
    }

    if (otpRecord.expiry < new Date()) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Delete OTP record once verified
    await Otp.deleteOne({ email: email.toLowerCase() });

    // Hash password and save the radiology center
    const hashedPassword = await bcrypt.hash(password, 10);

    const newRadiologyCenter = new RadiologyCenter({
      centerName,
      address,
      contactNumber,
      email: email.toLowerCase(),
      passwordHash: hashedPassword,
    });

    await newRadiologyCenter.save();
    const token = createToken(newRadiologyCenter._id);

    res.status(201).json({ message: "Registration successful. You can now log in.", token, radiologyCenter: newRadiologyCenter });

  } catch (error) {
    console.error("Error verifying OTP: ", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Login Radiology Center
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
