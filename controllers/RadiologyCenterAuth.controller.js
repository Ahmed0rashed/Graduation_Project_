const RadiologyCenter = require("../models/Radiology_Centers.Model");
const jwt = require("jsonwebtoken");
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
    subject: "Your One-Time Password (OTP) for Verification",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 500px; margin: auto;">
        <div style="text-align: center;">
          <img src="https://cdn.dribbble.com/userupload/15606497/file/original-1d7be0867731a998337730f39268a54a.png?format=webp&resize=400x300&vertical=center" alt="Company Logo" style="max-width: 150px; margin-bottom: 20px;">
        </div>
        <h2 style="color: #333; text-align: center;">OTP Verification</h2>
        <p style="font-size: 16px; color: #555;">Dear User,</p>
        <p style="font-size: 16px; color: #555;">Your One-Time Password (OTP) for verification is:</p>
        <div style="text-align: center; font-size: 22px; font-weight: bold; color: #007bff; padding: 10px; border: 1px dashed #007bff; border-radius: 5px; display: inline-block;">
          ${otp}
        </div>
        <p style="font-size: 16px; color: #555; margin-top: 20px;">This OTP is valid for <strong>5 minutes</strong>. Please do not share it with anyone.</p>
        <p style="font-size: 16px; color: #555;">If you did not request this code, please ignore this email or contact our support team.</p>
        <p style="font-size: 16px; color: #555;">Best regards,<br><strong>The Registration Team</strong></p>
      </div>
    `,
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


    await Otp.deleteOne({ email: email.toLowerCase() });


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


const sendEmail = async (email, name, phone, message) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "ahmedmohamedrashed236@gmail.com",
      pass: "ncjb nwhz gtcn rqrw",
    },
  });

  const mailOptions = {
    from: email,
    to: "ahmedmohamedrashed236@gmail.com",
    subject: "Radiology Center Support Request",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #2c3e50;">Radiology Center Support Request</h2>
        <p>Dear Technical Support Team,</p>
        <p>We are reaching out for assistance regarding an issue with our radiology application. Please find the details below:</p>
        
        <div style="background: #f4f4f4; padding: 10px; font-size: 18px; font-weight: bold; text-align: center; border-radius: 5px;">
          ${message}
        </div>

        <p><strong>Contact Information:</strong></p>
        <p><strong>Technician :</strong> ${name}</p>
        <p><strong>Email :</strong> <a href="mailto:${email}" style="color: #3498db;">${email}</a></p>
        <p><strong>Phone :</strong> ${phone}</p>

        <p>Please look into this at your earliest convenience. Let us know if any additional information is needed.</p>
        
        <p>Best regards,</p>
        <p><strong>Radiology Center team</strong></p>
      </div>
    `,
  
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};


exports.SendEmail = async (req, res) => {
  
  try {
    const { email, name, phone,massage } = req.body;

  

    await sendEmail(email, name, phone, massage);
  
    res.status(201).json({ message: "the massage sended successfully." });

  } catch (error) {
    console.error("Error in sending email ", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};