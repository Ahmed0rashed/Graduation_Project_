const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const validator = require('validator');
exports.addUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!email || !validator.isEmail(email)) {
      return res.send('A valid Email is Required');
    }
    if (!name) {
      return res.send('A valid name is required');
    }
    if (!password) {
      return res.send('A valid Password is required');
    }
    if (await User.findOne({ email })) {
      return res
        .status(400)
        .send(`This email "${email}" already exists`);
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      email,
      password: hashedPassword,
      name,
    });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Error registering user', error });

    console.log(`this error is ${error}`);
  }
};
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error });
    console.log(`this error is ${error}`);
  }
};

module.exports = exports;