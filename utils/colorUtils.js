const ShoesProduct = require("../models/ShoesProduct");
const logger = require("./logger");

/**
 * Get all unique colors available in the database
 * @returns {Promise<Array>} Array of unique color values
 */
async function getAllAvailableColors() {
  try {
    // Aggregate to get unique colors
    const uniqueColors = await ShoesProduct.aggregate([
      { $unwind: "$colors" }, // Split the colors array
      { $group: { _id: "$colors" } }, // Group by color value
      { $sort: { _id: 1 } }, // Sort alphabetically
    ]);

    // Extract just the color values
    return uniqueColors.map((item) => item._id).filter(Boolean);
  } catch (error) {
    logger.error("Error fetching available colors:", error);
    return [];
  }
}

/**
 * Detect color mentions in user message based on available database colors
 * @param {string} message - User message
 * @param {Array} availableColors - Colors available in database
 * @returns {Array} Array of detected colors
 */
function detectColors(message, availableColors = []) {
  const lowercaseMsg = message.toLowerCase();
  const detectedColors = [];

  // Handle edge case if no colors available
  if (!availableColors || availableColors.length === 0) {
    return [];
  }

  // Look for direct color mentions from database values
  for (const color of availableColors) {
    const lowerColor = color.toLowerCase();
    // Use word boundary to avoid matching substrings (like 'red' in 'bored')
    const colorRegex = new RegExp(`\\b${lowerColor}\\b`, "i");
    if (colorRegex.test(lowercaseMsg)) {
      detectedColors.push(color); // Use original case from database
    }
  }

  // Handle common color variations that might not exactly match database
  const colorVariations = {
    grey: "gray",
    gray: "grey",
    multicolored: "multicolor",
    "multi-color": "multicolor",
    "multi-colored": "multicolor",
    "multi colored": "multicolor",
  };

  // Check for color variations
  for (const [variation, standardColor] of Object.entries(colorVariations)) {
    if (new RegExp(`\\b${variation}\\b`, "i").test(lowercaseMsg)) {
      // Check if either the variation or standard form exists in database
      const dbColor = availableColors.find(
        (c) =>
          c.toLowerCase() === standardColor || c.toLowerCase() === variation
      );

      if (dbColor && !detectedColors.includes(dbColor)) {
        detectedColors.push(dbColor);
      }
    }
  }

  return detectedColors;
}

module.exports = {
  getAllAvailableColors,
  detectColors,
};
