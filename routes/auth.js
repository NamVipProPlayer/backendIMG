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
  try {
    const { name, email, password, phone } = req.body;

    // Check required fields
    if (!name || !email || !password || !phone) {
      return res
        .status(400)
        .json({ message: "Please fill all required fields." });
    }

    // Check if email is already in use
    let user = await Authenticate.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "Email already registered." });
    }

    // Default roleId = 1 (regular user)
    user = new Authenticate({
      name,
      email,
      password,
      roleId: 1, // Fixed to user role
      phone,
    });

    await user.save();
    res.status(201).json({ message: "User registered successfully!" });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
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

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error(" JWT_SECRET is missing in environment variables!");
      return res.status(500).json({ message: "Internal server error" });
    }

    const token = jwt.sign({ id: user._id, roleId: user.roleId }, jwtSecret, {
      expiresIn: "7d",
    });

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
// Fetch all users (Only Admins)
router.get("/users", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await Authenticate.find().select("-password"); // Exclude password field
    res.status(200).json(users);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
});

// Admin Only Route
router.get("/admin", authMiddleware, adminMiddleware, (req, res) => {
  res.status(200).json({ message: "Welcome Admin!" });
});

// Admin create user
router.post(
  "/admin/create-user",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { name, email, password, roleId, phone } = req.body;

      if (!name || !email || !password || !roleId) {
        return res.status(400).json({ message: "All fields are required." });
      }

      let user = await Authenticate.findOne({ email });
      if (user) {
        return res.status(400).json({ message: "Email already registered." });
      }
      user = new Authenticate({
        name,
        email,
        password,
        roleId,
        phone,
      });

      await user.save();
      res.status(201).json({ message: "Admin created user successfully!" });
    } catch (error) {
      console.error("Admin Create User Error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

module.exports = router;
