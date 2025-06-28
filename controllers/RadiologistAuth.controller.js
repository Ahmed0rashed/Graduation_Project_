const Radiologist = require("../models/Radiologists.Model");
const RadiologyCenter = require("../models/Radiology_Centers.Model");
const bcrypt = require("bcrypt");
const validator = require("validator");
const { createToken } = require("../utils/createToken");
const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");
const Otp = require("../models/OTP");
const Wallet = require('../models/payment/Wallet.Model');
const Admin = require("../models/admin.model");
const upload = require("../utils/cloudinary");
const axios = require('axios');







async function verifyIdCard(front_url, back_url) {
  if (!front_url || !back_url) {
    throw new Error('Both front_url and back_url are required');
  }

  try {
    const response = await axios.post('https://8b8d-41-33-141-180.ngrok-free.app/extract-text', {
      front_url,
      back_url
    });
    

    return response.data;
  } catch (error) {
    throw {
      message: error.message,
      details: error.response?.data || null
    };
  }
}



const sendOtpEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "radintelio1@gmail.com",
      pass: "mikq puco elmb mypn", 
    },
  });

  const mailOptions = {
    from: "radintelio1@gmail.com",
    to: email,
    subject: "Your One-Time Password (OTP) for Verification",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 500px; margin: auto;">
        <div style="text-align: center;">
           <img src="https://cdn.dribbble.com/userupload/15606497/file/original-1d7be0867731a998337730f39268a54a.png?format=webp&resize=400x300&vertical=center" alt="Radintal Banner" style="width: 100%; max-height: 240px; object-fit: cover;">
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

// const upload = require("../utils/upload"); // Make sure this is your upload module

exports.registerRadiologist = async (req, res) => {
  try {
    let { firstName, lastName, specialization, email, password, contactNumber } = req.body;

  
    if (typeof specialization === 'string') {
      specialization = specialization.split(',').map(s => s.trim());
    }

    
    const allowedSpecializations = Radiologist.schema.path("specialization").caster.enumValues;
    if (
      !specialization ||
      !Array.isArray(specialization) ||
      !specialization.every(sp => allowedSpecializations.includes(sp))
    ) {
      return res.status(400).json({
        message:
          "A valid specialization is required and should be an array with correct values",
      });
    }

   
    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ message: "A valid email is required" });
    }
    if (!firstName || !lastName) {
      return res.status(400).json({ message: "First name and last name are required" });
    }
    if (!contactNumber || !/^\+?[\d\s-]{10,15}$/.test(contactNumber)) {
      return res.status(400).json({ message: "A valid contact number is required" });
    }
    if (!password || !validator.isLength(password, { min: 8 })) {
      return res.status(400).json({ message: "Password should be at least 8 characters long" });
    }
    const specialCharacters = /[ !@#$%^&*(),.?":{}|<>\-_=+]/;
    if (!specialCharacters.test(password)) {
      return res.status(400).json({ message: "Password should contain at least one special character" });
    }

   
    if (await RadiologyCenter.findOne({ email })) {
      return res.status(400).json({ message: `This email already exists as a radiology center` });
    }

    if (await Radiologist.findOne({ email })) {
      return res.status(400).json({ message: `This email already exists as a radiologist` });
    }

    
    if (!req.frontId) {
      return res.status(400).json({ message: "A valid front id is required" });
    }
    if (!req.backId) {
      return res.status(400).json({ message: "A valid back id is required" });
    }

  
    const FrontId = await upload(req.frontId.buffer, "image"); 
    const BackId = await upload(req.backId.buffer, "image"); 
    const result = await verifyIdCard(FrontId, BackId);

    if(!result.isDoctor && !result.isRadiologist ){

      return res.status(400).json({ message: "your Card is not Valid as radiologist" }); 
    }
    if(!result.isValidCard){
      return res.status(400).json({ message: "your Card is not Valid" }); 
    }

    const otp = otpGenerator.generate(6, {
      digits: true,
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false
    });
    
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10);

    // Save OTP in the database
    const otpRecord = await Otp.findOneAndUpdate(
      { email: email.toLowerCase() },
      { otp, expiry },
      { upsert: true, new: true }
    );

   
    await sendOtpEmail(email, otp);

    return res.status(200).json({
      message: "OTP sent to email. Please verify to complete registration.",
      FrontId,
      BackId
    });

  } catch (error) {
    console.error("Error registering radiologist: ", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp, password, firstName, lastName, specialization, contactNumber ,frontId ,backId} = req.body;

    if (!email || !otp || !password || !firstName || !lastName || !specialization || !contactNumber) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Find OTP record
    const otpRecord = await Otp.findOne({ email: email.toLowerCase() });

    if (!otpRecord) {
      return res.status(400).json({ message: "OTP not found for this email" });
    }

    // Check if OTP is expired
    if (otpRecord.expiry < new Date()) {
      await Otp.deleteOne({ email: email.toLowerCase() }); // Cleanup expired OTP
      return res.status(400).json({ message: "OTP has expired" });
    }

    // Validate OTP
    if (otpRecord.otp !== otp) {
      await Otp.deleteOne({ email: email.toLowerCase() }); // Cleanup invalid OTP
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Delete OTP after successful verification
    await Otp.deleteOne({ email: email.toLowerCase() });

    // Ensure specialization is an array
    if (!Array.isArray(specialization)) {
      return res.status(400).json({ message: "Specialization must be an array" });
    }

    // Validate specialization values
    const validSpecializations = Radiologist.schema.path("specialization").options.enum.values;
    if (!specialization.every(sp => validSpecializations.includes(sp))) {
      return res.status(400).json({ message: "Invalid specialization provided" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new radiologist record
    const newRadiologist = new Radiologist({
      firstName,
      lastName,
      specialization,
      email: email.toLowerCase(),
      passwordHash: hashedPassword,
      contactNumber,
      frontId,
      backId,
      
    });

    // بعد إنشاء المستخدم radiologist أو center:
    const wallet = await Wallet.create({
      ownerId: newRadiologist._id,
      ownerType: 'Radiologist',
    });
    newRadiologist.walletId = wallet._id;
    await newRadiologist.save();


    res.status(201).json({ message: "Registration successful. You can now log in.", Radiologist: newRadiologist });

  } catch (error) {
    console.error("Error verifying OTP: ", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};




exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ message: "A valid email is required" });
    }
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const radiologyCenter = await RadiologyCenter.findOne({ email: email });
    const radiologist = await Radiologist.findOne({ email: email });
    const admin = await Admin.findOne({ email: email });

    if (!radiologyCenter && !radiologist && !admin) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    const user = radiologyCenter || radiologist || admin;
const role = radiologyCenter
  ? "RadiologyCenter"
  : radiologist
  ? "Radiologist"
  : "Admin";

    

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = createToken(user._id);
    res.status(200).json({ token, user, role });

  } catch (error) {
    console.error("Error logging in this account: ", error);
    res.status(500).json({ message: "Error logging in this account", error: error.message });
  }
};



const sendOtpForReset = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "radintelio1@gmail.com",
      pass: "mikq puco elmb mypn", 
    },
  });

  const mailOptions = {
    from: "radintelio1@gmail.com",
    to: email,
    subject: "Reset Your Password - OTP Code",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 500px; margin: auto;">
        <div style="text-align: center;">
           <img src="https://cdn.dribbble.com/userupload/15606497/file/original-1d7be0867731a998337730f39268a54a.png?format=webp&resize=600x220&vertical=center" alt="Radintal Invitation Banner" style="width: 100%; display: block;">
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

    const user = await Radiologist.findOne({ email: email });
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

    if (!otp) {
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


