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
// Add this route after the profile route

// Update user information
router.put("/updateProfile", authMiddleware, async (req, res) => {
  try {
    const { name, email, phone, currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Find user
    const user = await Authenticate.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // If updating email, check if new email already exists
    if (email && email !== user.email) {
      const emailExists = await Authenticate.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: "Email already in use." });
      }
      user.email = email;
    }

    // Update basic info
    if (name) user.name = name;
    if (phone) user.phone = phone;

    // Handle password change
    if (currentPassword && newPassword) {
      // Verify current password
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect." });
      }

      // Update to new password
      user.password = newPassword;
    }

    await user.save();

    // Return updated user without password
    const updatedUser = await Authenticate.findById(userId).select("-password");
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating profile",
      error: error.message,
    });
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
// Update a user (Admin only)

router.put(
  "/admin/update-user/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, phone, roleId, newPassword } = req.body;

      // Find user
      const user = await Authenticate.findById(id);
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      // Check if email is being changed and verify it's not already in use
      if (email && email !== user.email) {
        const emailExists = await Authenticate.findOne({ email });
        if (emailExists) {
          return res.status(400).json({ message: "Email already in use." });
        }
      }

      // Update user fields
      const updates = {};
      if (name) updates.name = name;
      if (email) updates.email = email;
      if (phone) updates.phone = phone;
      if (roleId) updates.roleId = roleId;
      if (newPassword) updates.password = newPassword;

      // Update user with validation
      const updatedUser = await Authenticate.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
      }).select("-password");

      res.status(200).json({
        success: true,
        message: "User updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Admin Update User Error:", error);
      res.status(500).json({
        success: false,
        message: "Error updating user",
        error: error.message,
      });
    }
  }
);
// Delete a user (Admin only)
router.delete(
  "/user/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Check if user exists
      const user = await Authenticate.findById(id);
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      // Prevent self-deletion (Admin cannot delete themselves)
      if (req.user.id === id) {
        return res
          .status(403)
          .json({ message: "You cannot delete your own account." });
      }

      await Authenticate.findByIdAndDelete(id);
      res.status(200).json({ message: "User deleted successfully." });
    } catch (error) {
      console.error("Delete User Error:", error);
      res
        .status(500)
        .json({ message: "Error deleting user", error: error.message });
    }
  }
);

module.exports = router;
