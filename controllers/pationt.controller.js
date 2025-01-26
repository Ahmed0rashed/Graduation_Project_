const User = require("../models/Patients.Model");
const bcrypt = require("bcrypt");
const validator = require("validator");

exports.addPatient = async (req, res) => {
  try {
    const { firstName, lastName, dateOfBirth, gender, email, password } = req.body;
    
    if (!email || !validator.isEmail(email)) {
      return res.send("A valid Email is Required");
    }
    if (!firstName || !lastName) {
      return res.send("First name and last name are required");
    }
    if (!dateOfBirth) {
      return res.send("Date of birth is required");
    }
    if (!gender || !['Male', 'Female'].includes(gender)) {
      return res.send("A valid gender is required");
    }
    if (!password) {
      return res.send("A valid Password is required");
    }
    if (await User.findOne({ email })) {
      return res.status(400).send(`This email "${email}" already exists`);
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const newPatient = new User({
      firstName,
      lastName,
      dateOfBirth,
      gender,
      email,
      passwordHash: hashedPassword,
    });
    
    await newPatient.save();
    res.status(201).json(newPatient);
  } catch (error) {
    res.status(500).json({ message: "Error registering patient", error });
    console.log(`this error is ${error}`);
  }
};
exports.getAllPatients = async (req, res) => {
  try {
    const patients = await User.find();
    res.status(200).json(patients);
  } catch (error) {
    res.status(500).json({ message: "Error fetching patients", error });
    console.log(`this error is ${error}`);
  }
};

module.exports = exports;
