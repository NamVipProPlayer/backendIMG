const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const Authenticate = require("../models/Authenticate");
const {
  authMiddleware,
  adminMiddleware,
} = require("../middlewares/authMiddleware");

const router = express.Router();

// Register User
router.post("/register", async (req, res) => {
  const { name, email, password, roleId, phone } = req.body;

  if (!name || !email || !password || !roleId) {
    return res
      .status(400)
      .json({ message: "Please fill all required fields." });
  }

  try {
    // Check if email already exists
    let user = await Authenticate.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "Email already registered." });
    }

    // Create new user
    user = new Authenticate({ name, email, password, roleId, phone });
    await user.save();

    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login User
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide email and password." });
  }

  try {
    const user = await Authenticate.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Validate password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { id: user._id, roleId: user.roleId },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({ token, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Protected Route (Requires Auth)
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await Authenticate.findById(req.user.id).select("-password");
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin Only Route
router.get("/admin", authMiddleware, adminMiddleware, (req, res) => {
  res.status(200).json({ message: "Welcome Admin!" });
});

module.exports = router;
