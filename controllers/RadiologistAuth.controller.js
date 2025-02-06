const Radiologist = require("../models/Radiologists.Model");
const bcrypt = require("bcrypt");
const validator = require("validator");
const { createToken } = require("../utils/createToken");  



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
        console.error(`Error registering radiologist: ${error.stack}`);  // More detailed logging
        res.status(500).json({ message: "Error registering radiologist", error: error.message });
      };
    };
  