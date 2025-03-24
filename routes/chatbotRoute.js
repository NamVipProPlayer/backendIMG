const express = require("express");
const router = express.Router();
const chatbotController = require("../controllers/chatbotController");
const { authMiddleware } = require("../middlewares/authMiddleware");

// Optional auth middleware function to allow non-authenticated users
const optionalAuthMiddleware = (req, res, next) => {
  try {
    // Try to authenticate but continue if it fails
    authMiddleware(req, res, () => {
      // Authentication succeeded or failed, continue either way
      next();
    });
  } catch (error) {
    // Authentication failed but we still want to proceed
    next();
  }
};

// Chat endpoint - works for both authenticated and non-authenticated users
router.post("/api/chat", optionalAuthMiddleware, chatbotController.processChat);

// The chatbot controller will have access to req.user if authenticated
// and req.user will be undefined if not authenticated

module.exports = router;
