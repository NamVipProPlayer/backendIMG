const { GoogleGenerativeAI } = require("@google/generative-ai");
const logger = require("../utils/logger");

let model = null;

/**
 * Initialize the Gemini AI model
 * @returns {Object} Initialized model
 */
function initializeAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    logger.error("Missing GEMINI_API_KEY in environment variables");
    throw new Error("AI configuration error: Missing API key");
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    return model;
  } catch (error) {
    logger.error("Failed to initialize Gemini AI:", error);
    throw error;
  }
}

/**
 * Get the initialized Gemini model
 * @returns {Object|null} Gemini model or null if not initialized
 */
function getGeminiModel() {
  if (!model) {
    try {
      return initializeAI();
    } catch (error) {
      return null;
    }
  }
  return model;
}

module.exports = {
  initializeAI,
  getGeminiModel,
};
