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

const sendOtpForReset = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "ahmedmohamedrashed236@gmail.com",
      pass: "ncjb nwhz gtcn rqrw",
    },
  });

  const mailOptions = {
    from: "your-email@gmail.com",
    to: email,
    subject: "Reset Your Password - OTP Code",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 500px; margin: auto;">
        <div style="text-align: center;">
          <img src="https://cdn.dribbble.com/userupload/15606497/file/original-1d7be0867731a998337730f39268a54a.png?format=webp&resize=400x300&vertical=center" 
          alt="Company Logo" style="max-width: 150px; margin-bottom: 20px;">
        </div>
        <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
        <p style="font-size: 16px; color: #555;">Dear User,</p>
        <p style="font-size: 16px; color: #555;">You requested to reset your password. Use the following OTP to proceed:</p>
        <div style="text-align: center; font-size: 22px; font-weight: bold; color: #007bff; padding: 10px; border: 1px dashed #007bff; border-radius: 5px; display: inline-block;">
          ${otp}
        </div>
        <p style="font-size: 16px; color: #555; margin-top: 20px;">This OTP is valid for <strong>5 minutes</strong>. Do not share it with anyone.</p>
        <p style="font-size: 16px; color: #555;">If you did not request this password reset, please ignore this email or contact support.</p>
        <p style="font-size: 16px; color: #555;">Best regards,<br><strong>Support Team</strong></p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};



// forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ message: "A valid email is required" });
    }

    const user = await Radiologist.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    const otp = otpGenerator.generate(6, { upperCase: false, specialChars: false });
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 5);

    await Otp.findOneAndUpdate(
      { email: email.toLowerCase() },
      { otp, expiry },
      { upsert: true, new: true }
    );

    await sendOtpForReset(email, otp);

    res.status(200).json({ message: "OTP sent to email. Please use it to reset your password." });
  } catch (error) {
    console.error("Error in forgot password: ", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ message: "A valid email is required" });
    }

    if (!otp ) {
      return res.status(400).json({ message: "A valid OTP is required" });
    }

    if (!newPassword) {
      return res.status(400).json({ message: "A strong password is required" });
    }

    const otpRecord = await Otp.findOne({ email: email.toLowerCase(), otp: otp });
    if (!otpRecord || otpRecord.expiry < new Date()) {
      return res.status(400).json({ message: "Invalid OTP or OTP has expired" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await Radiologist.findOneAndUpdate(
      { email: email.toLowerCase() },
      { passwordHash: hashedPassword },
      { new: true }
    );

    await Otp.findOneAndDelete({ email: email.toLowerCase() });

    res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    console.error("Error in reset password: ", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


