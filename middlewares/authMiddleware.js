const jwt = require("jsonwebtoken");
require("dotenv").config();
const Authenticate = require("../models/Authenticate");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Access Denied! No Token Provided." });
  }

  const token = authHeader.split(" ")[1]; // ✅ Extract token after "Bearer"

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user info to request

    // Fetch user from DB
    const user = await Authenticate.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    next();
  } catch (error) {
    res.status(400).json({ message: "Invalid Token" });
  }
};

// Middleware for Admin Access
const adminMiddleware = (req, res, next) => {
  if (req.user.roleId !== 2) {
    return res.status(403).json({ message: "Access Denied! Admins Only." });
  }
  next();
};

module.exports = { authMiddleware, adminMiddleware };
