const Radiologist = require("../models/Radiologists.Model");
const bcrypt = require("bcrypt");
const validator = require("validator");
const { createToken } = require("../utils/createToken");
const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");
const Otp = require("../models/OTP");


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


exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    
    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ message: "A valid email is required" });
    }

    
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
    console.error("Error sending OTP: ", error);
    res.status(500).json({ message: "Error sending OTP", error: error.message });
  }
};


exports.registerRadiologist = async (req, res) => {
  try {
    const { firstName, lastName, specialization, email, password, contactNumber } = req.body;

    
    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ message: "A valid email is required" });
    }
    if (!firstName || !lastName) {
      return res.status(400).json({ message: "First name and last name are required" });
    }
    if (!specialization || !Radiologist.schema.path("specialization").enumValues.includes(specialization)) {
      return res.status(400).json({ message: "A valid specialization is required" });
    }
    if (!contactNumber || !/^\+?[\d\s-]{10,15}$/.test(contactNumber)) {
      return res.status(400).json({ message: "A valid contact number is required" });
    }
    if (!password) {
      return res.status(400).json({ message: "A valid password is required" });
    }

    
    const existingRadiologist = await Radiologist.findOne({ email: email.toLowerCase() });
    if (existingRadiologist) {
      return res.status(400).json({ message: `This email "${email}" is already registered.` });
    }

    
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
    console.error("Error registering radiologist: ", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.verifyOtp = async (req, res) => {
  
  try {
    const { email, otp, password, firstName, lastName, specialization, contactNumber } = req.body;

  
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

    
    await Otp.deleteOne({ email: email.toLowerCase() });

    
    const hashedPassword = await bcrypt.hash(password, 10);

    const newRadiologist = new Radiologist({
      firstName,
      lastName,
      specialization,
      email: email.toLowerCase(),
      passwordHash: hashedPassword,
      contactNumber,
    });

    await newRadiologist.save();
    const token = createToken(newRadiologist._id);

    res.status(201).json({ message: "Registration successful. You can now log in.", token, Radiologist: newRadiologist });

  } catch (error) {
    console.error("Error verifying OTP: ", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


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
