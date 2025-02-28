const jwt = require("jsonwebtoken");

const createToken = (userId) => {
  return jwt.sign({ id: userId }, "123", { expiresIn: "12h" });
};

module.exports = { createToken };
