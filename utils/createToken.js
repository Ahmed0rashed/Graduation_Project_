const jwt = require("jsonwebtoken");

const createToken = (userId) => {
  return jwt.sign({ id: userId }, "123", { expiresIn: "1h" });
};

module.exports = { createToken };
