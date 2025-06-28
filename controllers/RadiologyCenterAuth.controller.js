const RadiologyCenter = require("../models/Radiology_Centers.Model");
const Radiologist = require("../models/Radiologists.Model");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const validator = require("validator");
const { createToken } = require("../utils/createToken");
const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");
const Otp = require("../models/OTP");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const path = require("path");



cloudinary.config({
  cloud_name: 'dncawa23w',
  api_key: '451913596668632',
  api_secret: 'KboaQ-CpKdNpD0oJ0JvAagR3N_4',
});


const storage = multer.diskStorage({
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

const upload = multer({ storage });




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
           <img src="https://cdn.dribbble.com/userupload/15606497/file/original-1d7be0867731a998337730f39268a54a.png?format=webp&resize=600x220&vertical=center" alt="Radintal Invitation Banner" style="width: 100%; display: block;">
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
    if (!contactNumber) {
      return res.status(400).json({ message: "A valid contact number is required" });
    }
    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }
    if (await RadiologyCenter.findOne({ email }) ) {
      return res.status(400).json({ message: `This email already exists as a radiology center` });
    }
    if (await Radiologist.findOne({ email }) ) {
      return res.status(400).json({ message: `This email already exists as a radiologist` });
    }
    if (!validator.isLength(password, { min: 8 })) {
      return res.status(400).json({ message: "Password should be at least 8 characters long" });
    }
    const specialCharacters = /[ !@#$%^&*(),.?":{}|<>\-_=+]/;
    if (!specialCharacters.test(password)) {
      return res.status(400).json({ message: "Password should contain at least one special character" });
    }
    if (!validator.isNumeric(contactNumber)) {
      return res.status(400).json({ message: "Contact number should be numeric" });
    }
    if (!validator.isNumeric(address.zipCode)) {
      return res.status(400).json({ message: "ZIP code should be numeric" });
    }
    if (!validator.isLength(address.zipCode, { min: 5, max: 5 })) {
      return res.status(400).json({ message: "ZIP code should be 5 digits" });
    }
    if (!validator.isLength(contactNumber, { min: 10, max: 15 })) {
      return res.status(400).json({ message: "Contact number should be between 10 and 15 digits" });
    }

    const otp = otpGenerator.generate(6, {
      digits: true,
      lowerCaseAlphabets: false,
      upperCaseAlphabets: false,
      specialChars: false
    });
    
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 5);

    await Otp.findOneAndUpdate(
      { email: email },
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
    const { email, otp, password, centerName, contactNumber,zipCode,street,city,state } = req.params;  
    

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
    const parsedAddress = {
      street,
      city,
      state,
      zipCode,  
    };

    await Otp.deleteOne({ email: email.toLowerCase() });

    const hashedPassword = await bcrypt.hash(password, 10);

    let uploadedFileUrl = null;
    if (req.file) {
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "radiology_centers" },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
        stream.end(req.file.buffer); 
      });

      uploadedFileUrl = uploadResult.secure_url;
    }

    const newRadiologyCenter = new RadiologyCenter({
      centerName,
      address : parsedAddress,
      contactNumber,
      email: email,
      passwordHash: hashedPassword,
      path: uploadedFileUrl, 
    });

    await newRadiologyCenter.save();
    
    await sendEmailWithAllINformations(
      newRadiologyCenter.email, 
      newRadiologyCenter.centerName, 
      newRadiologyCenter.contactNumber, 
      newRadiologyCenter.address, 
      newRadiologyCenter.path
    );

    res.status(201).json({ 
      message: "The request has been sent successfully", 
      _id: newRadiologyCenter._id, 
      radiologyCenter: newRadiologyCenter 
    });

  } catch (error) {
    console.error("Error verifying OTP: ", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const sendEmailWithAllINformations = async (email, centerName, contactNumber, address,path) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "radintelio1@gmail.com",
      pass: "mikq puco elmb mypn", 
    },
  });

  const mailOptions = {
    from: email,
    to: "radintelio1@gmail.com", 
    subject: "New Registration Request from Radiology Center",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 500px; margin: auto;">
        <div style="text-align: center;">
          <img src="https://cdn.dribbble.com/userupload/15606497/file/original-1d7be0867731a998337730f39268a54a.png?format=webp&resize=600x220&vertical=center" alt="Radintal Invitation Banner" style="width: 100%; display: block;">
        </div>
        <h2 style="color: #333; text-align: center;">New Registration Request</h2>
        <p style="font-size: 16px; color: #555;">Dear Support Team,</p>
        <p style="font-size: 16px; color: #555;">A new radiology center has submitted a request for registration. Please review the details below:</p>
        <ul style="list-style-type: none; padding: 0; margin: 0;">
          <li style="margin-bottom: 10px;"><strong>Center Name:</strong> ${centerName}</li>
          <li style="margin-bottom: 10px;"><strong>Email:</strong> ${email}</li>
          <li style="margin-bottom: 10px;"><strong>Contact Number:</strong> ${contactNumber}</li>
          <li style="margin-bottom: 10px;"><strong>Address:</strong> ${address.street}, ${address.city}, ${address.state}, ${address.zipCode}</li>
          <li style="margin-bottom: 10px;"><strong>License:</strong> <a href="${path}">View License</a></li>
          
        </ul>
        <p style="font-size: 16px; color: #555;">Please process this request and confirm the registration status.</p>
        <p style="font-size: 16px; color: #555;">Best regards,</p>
        <p style="font-size: 16px; color: #555;"><strong>Automated Registration System</strong></p>
      </div>
    `,
  };
  
  return transporter.sendMail(mailOptions);
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
      user: "radintelio1@gmail.com",
      pass: "mikq puco elmb mypn", 
    },
  });

  const mailOptions = {
    from: email,
    to: "radintelio1@gmail.com",
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



exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ message: "A valid email is required" });
    }

    const radiologyCenter = await RadiologyCenter.findOne({ email });
    const radiologist = await Radiologist.findOne({ email });

    if (!radiologyCenter && !radiologist) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    const otp = otpGenerator.generate(6, { upperCase: false, specialChars: false });
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 10);

    await Otp.deleteOne({ email });

    const otpRecord = new Otp({ email, otp, expiry });
    await otpRecord.save();

    try {
      await sendOtpForReset(email, otp);
    } catch (emailError) {
      console.error("Error sending OTP email:", emailError);
      return res.status(500).json({ message: "Failed to send OTP email." });
    }

    res.status(200).json({ message: "OTP sent to email. Please use it to reset your password." });

  } catch (error) {
    console.error("Error in forgot password:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};




exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ message: "A valid email is required" });
    }
    if (!validator.isLength(newPassword, { min: 8 })) {
      return res.status(400).json({ message: "Password should be at least 8 characters long" });
    }
    const specialCharacters = /[ !@#$%^&*(),.?":{}|<>\-_=+]/;
    if (!specialCharacters.test(newPassword)) {
      return res.status(400).json({ message: "Password should contain at least one special character" });
    }
    if (!newPassword) {
      return res.status(400).json({ message: "A strong password is required" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    
    let userModel = null;
    let user = await RadiologyCenter.findOne({ email: email });
    if (!user) {
      user = await Radiologist.findOne({ email: email });
      userModel = Radiologist;
    } else {
      userModel = RadiologyCenter;
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    
    await userModel.updateOne(
      { email: email },
      { passwordHash: hashedPassword }
    );

    
    await Otp.findOneAndDelete({ email: email.toLowerCase() });

    res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    console.error("Error in reset password: ", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.checkOtp = async (req, res) => {
  try {
    const { email, otp} = req.body;

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ message: "A valid email is required" });
    }

    if (!otp) {
      return res.status(400).json({ message: "A valid OTP is required" });
    }

    const otpRecord = await Otp.findOne({ email: email.toLowerCase(), otp: otp });
    if (!otpRecord || otpRecord.expiry < new Date()) {
      return res.status(400).json({ message: "Invalid OTP or OTP has expired" });
    }

    let userModel = null;
    let user = await RadiologyCenter.findOne({ email: email });
    if (!user) {
      user = await Radiologist.findOne({ email: email });
      userModel = Radiologist;
    } else {
      userModel = RadiologyCenter;
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await Otp.findOneAndDelete({ email: email.toLowerCase() });

    res.status(200).json({ message: "OTP is valid." });
  } catch (error) {
    console.error("Error in checking OTP: ", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
