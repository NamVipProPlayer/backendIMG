const { calculateStringSimilarity } = require("../utils/stringUtils");
const ShoesProduct = require("../models/ShoesProduct");
const logger = require("../utils/logger");

/**
 * Extract size mentions from message
 * @param {string} message - The user message
 * @returns {Array} Array of detected sizes as numbers
 */
function extractSizes(message) {
  // Match patterns like "size 42", "size 8.5", "39", "EU 40", "US 9", etc.
  const sizePatterns = [
    /\bsize\s+(\d+(?:\.\d+)?)\b/i,
    /\beu\s+(\d+(?:\.\d+)?)\b/i,
    /\bus\s+(\d+(?:\.\d+)?)\b/i,
    /\buk\s+(\d+(?:\.\d+)?)\b/i,
    // Match stand-alone numbers that could be sizes (between 3 and 50)
    /\b((?:3\d|4\d|[5-9]|1\d|2\d|[1-4][0-9]|50)(?:\.\d+)?)\b/i,
  ];

  const sizes = [];

  for (const pattern of sizePatterns) {
    const matches = message.match(pattern);
    if (matches && matches[1]) {
      // Convert matched size to number
      const size = parseFloat(matches[1]);
      if (!isNaN(size) && size >= 3 && size <= 50) {
        // Reasonable shoe size range
        sizes.push(size);
      }
    }
  }

  return [...new Set(sizes)]; // Return unique sizes
}

/**
 * Extract price range from message
 * @param {string} message - The user message
 * @returns {Object|null} Price range object with min and max properties, or null if no price mentioned
 */
function extractPriceRange(message) {
  const lowercaseMsg = message.toLowerCase();

  // Existing patterns
  const underPattern =
    /\b(?:under|less than|below|cheaper than|max|maximum)(?:\s+[\$€£])?\s*(\d+(?:\.\d+)?)\b/i;
  const overPattern =
    /\b(?:over|more than|above|min|minimum|at least)(?:\s+[\$€£])?\s*(\d+(?:\.\d+)?)\b/i;
  const betweenPattern =
    /\b(?:between|from)(?:\s+[\$€£])?\s*(\d+(?:\.\d+)?)(?:\s+(?:and|to|-|–)|\s*-\s*)(?:[\$€£])?\s*(\d+(?:\.\d+)?)\b/i;
  const valuePattern =
    /\b(\d+(?:\.\d+)?)(?:\s+(?:dollars|euros|pounds|bucks|€|£|\$))\b/i;
  const currencyPattern = /\b[\$€£](\d+(?:\.\d+)?)\b/i;

  // NEW PATTERNS
  // Pattern for "in range X" or "around X"
  const rangePattern =
    /\b(?:in\s+range|around|about)(?:\s+[\$€£])?\s*(\d+(?:\.\d+)?)\b/i;

  // Pattern for standalone numbers that could be prices (between 1 and any number of digits)
  const standalonePrice = /\b(\d+(?:\.\d+)?)(?!\s*(?:\$|€|£|size|eu|us|uk))\b/i;

  // First check for range pattern (new)
  const rangeMatch = lowercaseMsg.match(rangePattern);
  if (rangeMatch && rangeMatch[1]) {
    const exactPrice = parseFloat(rangeMatch[1]);
    if (!isNaN(exactPrice)) {
      return {
        min: Math.max(1, exactPrice * 0.8),
        max: exactPrice * 1.2,
      };
    }
  }

  // First check for between pattern
  const betweenMatch = lowercaseMsg.match(betweenPattern);
  if (betweenMatch && betweenMatch[1] && betweenMatch[2]) {
    const min = parseFloat(betweenMatch[1]);
    const max = parseFloat(betweenMatch[2]);
    if (!isNaN(min) && !isNaN(max)) {
      return { min, max };
    }
  }

  // Initialize min and max to unrestricted
  let min = null;
  let max = null;

  // Check for under pattern
  const underMatch = lowercaseMsg.match(underPattern);
  if (underMatch && underMatch[1]) {
    max = parseFloat(underMatch[1]);
    if (isNaN(max)) max = null;
  }

  // Check for over pattern
  const overMatch = lowercaseMsg.match(overPattern);
  if (overMatch && overMatch[1]) {
    min = parseFloat(overMatch[1]);
    if (isNaN(min)) min = null;
  }

  // Check for value pattern
  const valueMatch = lowercaseMsg.match(valuePattern);
  if (valueMatch && valueMatch[1]) {
    // If exact price mentioned, set a range around it (±20%)
    const exactPrice = parseFloat(valueMatch[1]);
    if (!isNaN(exactPrice)) {
      min = exactPrice * 0.8;
      max = exactPrice * 1.2;
    }
  }

  // Check for currency pattern
  const currencyMatch = lowercaseMsg.match(currencyPattern);
  if (currencyMatch && currencyMatch[1]) {
    // If exact price mentioned, set a range around it (±20%)
    const exactPrice = parseFloat(currencyMatch[1]);
    if (!isNaN(exactPrice)) {
      min = exactPrice * 0.8;
      max = exactPrice * 1.2;
    }
  }

  // NEW: Check for standalone price
  const standaloneMatch = lowercaseMsg.match(standalonePrice);
  if (standaloneMatch && standaloneMatch[1]) {
    const exactPrice = parseFloat(standaloneMatch[1]);
    if (!isNaN(exactPrice) && exactPrice >= 10) {
      // Likely a price if >= 10
      min = exactPrice * 0.8;
      max = exactPrice * 1.2;
    }
  }

  // If at least one constraint was found, return the range
  if (min !== null || max !== null) {
    return { min, max };
  }

  return null;
}

/**
 * Find shoes matching size criteria
 * @param {string} message - Lowercase user message
 * @param {Array} inventory - Array of shoe objects
 * @returns {Array} Matching shoes
 */
function findSizeMatches(message, inventory) {
  const sizeFilters = extractSizes(message);

  if (!sizeFilters.length) return [];

  logger.debug(`Size filters: ${sizeFilters.join(", ")}`);

  return inventory.filter((shoe) => {
    // Skip shoes without sizes
    if (!shoe.sizes || !Array.isArray(shoe.sizes)) return false;

    // Check if any requested size is available for this shoe
    return sizeFilters.some((requestedSize) =>
      shoe.sizes.some((shoeSize) => {
        // Handle both number and object representations of sizes
        if (typeof shoeSize === "number") {
          return shoeSize === requestedSize;
        } else if (typeof shoeSize === "object" && shoeSize.size) {
          return parseFloat(shoeSize.size) === requestedSize;
        }
        return false;
      })
    );
  });
}

/**
 * Find shoes matching price criteria
 * @param {string} message - Lowercase user message
 * @param {Array} inventory - Array of shoe objects
 * @returns {Array} Matching shoes
 */
function findPriceMatches(message, inventory) {
  const priceRange = extractPriceRange(message);

  if (!priceRange) return [];

  logger.debug(
    `Price range: ${priceRange.min || "any"} - ${priceRange.max || "any"}`
  );

  return inventory.filter((shoe) => {
    // Skip shoes without price
    if (!shoe.price && shoe.price !== 0) return false;

    // Check min price constraint
    if (priceRange.min !== null && shoe.price < priceRange.min) {
      return false;
    }

    // Check max price constraint
    if (priceRange.max !== null && shoe.price > priceRange.max) {
      return false;
    }

    return true;
  });
}

/**
 * Find shoes mentioned in the user message
 * @param {string} message - The user message
 * @param {Array} inventory - Array of shoe objects
 * @param {Array} colorFilters - Optional color filters
 * @returns {Array} Array of mentioned shoe objects
 */
function findMentionedShoes(message, inventory, colorFilters = []) {
  if (!inventory || !Array.isArray(inventory)) return [];

  const lowercaseMsg = message.toLowerCase().trim();
  let mentionedShoes = [];
  const seenIds = new Set();

  // Check if this is a price-based query
  const priceMatches = findPriceMatches(lowercaseMsg, inventory);
  if (priceMatches.length > 0) {
    logger.debug(`Found ${priceMatches.length} shoes matching price criteria`);
    for (const shoe of priceMatches) {
      if (!seenIds.has(shoe._id.toString())) {
        mentionedShoes.push(shoe);
        seenIds.add(shoe._id.toString());
      }
    }

    // If we found shoes by price, we'll still continue with other filters
    // but start with this subset
    inventory = priceMatches;
  }

  // First check if this is a size-based query
  const sizeMatches = findSizeMatches(lowercaseMsg, inventory);
  if (sizeMatches.length > 0) {
    logger.debug(`Found ${sizeMatches.length} shoes matching size criteria`);
    // Clear previous matches if we're starting fresh with size matches
    if (mentionedShoes.length === 0) {
      for (const shoe of sizeMatches) {
        if (!seenIds.has(shoe._id.toString())) {
          mentionedShoes.push(shoe);
          seenIds.add(shoe._id.toString());
        }
      }
    } else {
      // Get intersection of price and size matches
      mentionedShoes = mentionedShoes.filter((shoe) =>
        sizeMatches.some(
          (sizeMatch) => sizeMatch._id.toString() === shoe._id.toString()
        )
      );
    }

    // If we found shoes by size, return them directly (with color filtering)
    if (mentionedShoes.length > 0) {
      return applyColorFilters(mentionedShoes, colorFilters);
    }
  }

  // Check for category/brand based searches first
  const brandCategoryMatches = findBrandCategoryMatches(
    lowercaseMsg,
    inventory
  );

  if (brandCategoryMatches.length > 0) {
    for (const shoe of brandCategoryMatches) {
      if (!seenIds.has(shoe._id.toString())) {
        mentionedShoes.push(shoe);
        seenIds.add(shoe._id.toString());
        logger.debug(`Brand+Category match found: "${shoe.name}"`);
      }
    }

    // If we found shoes by brand+category, return them directly
    if (mentionedShoes.length > 0) {
      return applyColorFilters(mentionedShoes, colorFilters);
    }
  }

  // Add this new section to handle gender-only searches
  const genderOnlyMatches = findGenderOnlyMatches(lowercaseMsg, inventory);
  if (genderOnlyMatches.length > 0) {
    for (const shoe of genderOnlyMatches) {
      if (!seenIds.has(shoe._id.toString())) {
        mentionedShoes.push(shoe);
        seenIds.add(shoe._id.toString());
        logger.debug(`Gender-only match found: "${shoe.name}"`);
      }
    }

    // If we found shoes by gender, return them directly (with color filtering)
    if (mentionedShoes.length > 0) {
      return applyColorFilters(mentionedShoes, colorFilters).slice(0, 5); // Return up to 5 matches
    }
  }

  // Check if this is a best seller query
  const bestSellerMatches = findBestSellerMatches(lowercaseMsg, inventory);
  if (bestSellerMatches.length > 0) {
    logger.debug(`Found ${bestSellerMatches.length} best seller shoes`);
    for (const shoe of bestSellerMatches) {
      if (!seenIds.has(shoe._id.toString())) {
        mentionedShoes.push(shoe);
        seenIds.add(shoe._id.toString());
      }
    }

    // If we found best seller shoes, return them directly (with color filtering)
    if (mentionedShoes.length > 0) {
      return applyColorFilters(mentionedShoes, colorFilters).slice(0, 5); // Return up to 5 best sellers
    }
  }

  // Continue with your existing exact match logic
  // First, try to find exact matches for shoe names
  for (const shoe of inventory) {
    if (!shoe.name || !shoe._id) continue;

    const shoeName = shoe.name.toLowerCase();
    if (lowercaseMsg.includes(shoeName)) {
      if (!seenIds.has(shoe._id.toString())) {
        mentionedShoes.push(shoe);
        seenIds.add(shoe._id.toString());
        logger.debug(`Exact match found: "${shoe.name}"`);
      }
    }
  }

  // If no exact matches, try partial matching with special handling for hyphenated names
  if (mentionedShoes.length === 0) {
    // Split message and preprocess
    const msgWords = lowercaseMsg.split(/\s+/);

    // Handle hyphenated words - create variations with and without hyphens
    const msgParts = new Set(msgWords);
    for (const word of msgWords) {
      if (word.includes("-")) {
        // Add parts separated by hyphen
        word.split("-").forEach((part) => {
          if (part.length > 2) msgParts.add(part);
        });
      }
    }

    // Create phrase combinations (3+ consecutive words)
    for (let i = 0; i < msgWords.length - 1; i++) {
      for (let j = i + 1; j < Math.min(i + 5, msgWords.length); j++) {
        const phrase = msgWords.slice(i, j + 1).join(" ");
        if (phrase.length > 4) {
          msgParts.add(phrase);
        }
      }
    }

    // Score each shoe based on how many parts of its name match parts in the message
    const scoredShoes = [];

    for (const shoe of inventory) {
      if (!shoe.name || !shoe._id || seenIds.has(shoe._id.toString())) continue;

      const shoeName = shoe.name.toLowerCase();
      // Handle both space and hyphen separated parts
      const shoeNameParts = shoeName
        .split(/[\s-]+/)
        .filter((part) => part.length > 2);

      let score = 0;
      let matchedParts = [];

      // Check each meaningful part of the shoe name
      for (const part of shoeNameParts) {
        // Skip very common words
        if (["the", "and", "for", "with"].includes(part)) continue;

        // Direct part match
        if (msgParts.has(part)) {
          score += part.length; // Longer matches score higher
          matchedParts.push(part);
          continue;
        }

        // Check if part appears directly in message
        if (lowercaseMsg.includes(part) && part.length > 3) {
          score += part.length - 1;
          matchedParts.push(part);
          continue;
        }

        // Check for high similarity with longer parts
        if (part.length > 4) {
          for (const msgPart of msgParts) {
            if (
              msgPart.length > 4 &&
              calculateStringSimilarity(msgPart, part) > 0.8
            ) {
              score += 3;
              matchedParts.push(part);
              break;
            }
          }
        }
      }

      // Additional score for brand match
      if (shoe.brand && lowercaseMsg.includes(shoe.brand.toLowerCase())) {
        score += 5;
        matchedParts.push(shoe.brand.toLowerCase());
      }

      // Special handling for distinctive identifiers like "Red-Hawls"
      const specialIdentifiers = shoeNameParts.filter(
        (part) =>
          part.length > 3 &&
          ![
            "air",
            "jordan",
            "nike",
            "adidas",
            "shoe",
            "boot",
            "sneaker",
          ].includes(part)
      );

      for (const identifier of specialIdentifiers) {
        const noHyphenVersion = identifier.replace("-", " ");
        if (
          lowercaseMsg.includes(identifier) ||
          (noHyphenVersion !== identifier &&
            lowercaseMsg.includes(noHyphenVersion))
        ) {
          score += 10; // High score for unique identifier match
          matchedParts.push(identifier);
        }
      }

      // Only consider shoes with meaningful matches
      if (score > 5 || matchedParts.length >= 2) {
        scoredShoes.push({
          shoe,
          score,
          matchedParts: [...new Set(matchedParts)],
        });
      }
    }

    // Sort by score and add top matches
    if (scoredShoes.length > 0) {
      scoredShoes.sort((a, b) => b.score - a.score);
      for (const { shoe, score, matchedParts } of scoredShoes.slice(0, 3)) {
        if (!seenIds.has(shoe._id.toString())) {
          logger.debug(
            `Matched "${shoe.name}" with score ${score} (${matchedParts.join(
              ", "
            )})`
          );
          mentionedShoes.push(shoe);
          seenIds.add(shoe._id.toString());
        }
      }
    }
  }

  // If still no matches, fall back to brand + product type combinations
  if (mentionedShoes.length === 0) {
    const brands = [
      ...new Set(
        inventory
          .filter((shoe) => shoe.brand)
          .map((shoe) => shoe.brand.toLowerCase())
      ),
    ];
    const shoeTypes = [
      "running",
      "sneaker",
      "boot",
      "sandal",
      "casual",
      "athletic",
      "mid", // Added to catch "Air Jordan Mid"
      "low", // Added for shoes like "Air Force 1 Low"
      "high", // Added for high-top shoes
    ];

    for (const brand of brands) {
      if (lowercaseMsg.includes(brand)) {
        for (const type of shoeTypes) {
          if (lowercaseMsg.includes(type)) {
            // Find shoes matching this brand and type
            const matches = inventory.filter(
              (shoe) =>
                shoe.brand &&
                shoe.brand.toLowerCase() === brand &&
                (shoe.name.toLowerCase().includes(type) ||
                  (shoe.category && shoe.category.toLowerCase().includes(type)))
            );
            for (const shoe of matches) {
              if (!seenIds.has(shoe._id.toString())) {
                logger.debug(
                  `Brand+Type match: ${brand} + ${type} -> ${shoe.name}`
                );
                mentionedShoes.push(shoe);
                seenIds.add(shoe._id.toString());
              }
            }
          }
        }
      }
    }
  }

  // Apply color filters at the end
  return applyColorFilters(mentionedShoes, colorFilters).slice(0, 3); // Limit to top 3 matches
}

/**
 * Find shoes matching brand and category/gender criteria
 * @param {string} message - Lowercase user message
 * @param {Array} inventory - Array of shoe objects
 * @returns {Array} Matching shoes
 */
function findBrandCategoryMatches(message, inventory) {
  // Extract brand mentions
  const brandMentions = extractBrands(message, inventory);
  if (!brandMentions.length) return [];

  // Look for gender/category mentions
  const genderMentions = extractGender(message);
  const categoryMentions = extractCategory(message);

  // If no filters, return empty array (don't want to return all shoes of a brand)
  if (!genderMentions.length && !categoryMentions.length) return [];

  // Filter inventory by brand and gender/category
  return inventory.filter((shoe) => {
    // Must match brand
    if (!shoe.brand || !brandMentions.includes(shoe.brand.toLowerCase())) {
      return false;
    }

    // Match gender if mentioned (in name or category field)
    if (genderMentions.length) {
      const shoeNameLower = shoe.name ? shoe.name.toLowerCase() : "";
      const shoeCategoryLower = shoe.category
        ? shoe.category.toLowerCase()
        : "";

      // Check if any gender word is in shoe name or category
      const matchesGender = genderMentions.some((gender) => {
        // Direct inclusion check
        if (
          shoeNameLower.includes(gender) ||
          shoeCategoryLower.includes(gender)
        ) {
          return true;
        }

        // Check for pattern variations in category (e.g., "Women's shoes", "Man's Shoes")
        const genderVariations = [
          gender + "'s shoes",
          gender + "s shoes",
          gender + " shoes",
        ];

        return genderVariations.some((variation) =>
          shoeCategoryLower.includes(variation)
        );
      });

      if (!matchesGender) return false;
    }

    // Match category if mentioned
    if (categoryMentions.length && shoe.category) {
      const shoeCategoryLower = shoe.category.toLowerCase();

      // Check if any category word is in shoe category
      const matchesCategory = categoryMentions.some((category) =>
        shoeCategoryLower.includes(category)
      );

      if (!matchesCategory) return false;
    }

    return true;
  });
}

/**
 * Find shoes matching gender criteria only
 * @param {string} message - Lowercase user message
 * @param {Array} inventory - Array of shoe objects
 * @returns {Array} Matching shoes
 */
function findGenderOnlyMatches(message, inventory) {
  const genderMentions = extractGender(message);

  if (!genderMentions.length) return [];

  logger.debug(`Gender-only search with: ${genderMentions.join(", ")}`);

  // Normalize gender terms - convert singular to plural forms
  const normalizedGenders = genderMentions.map((gender) => {
    if (gender === "man" || gender === "man's" || gender === "mans") {
      return "man";
    }
    if (gender === "woman" || gender === "woman's" || gender === "womans") {
      return "women";
    }
    return gender;
  });

  return inventory.filter((shoe) => {
    const shoeNameLower = shoe.name ? shoe.name.toLowerCase() : "";
    const shoeCategoryLower = shoe.category ? shoe.category.toLowerCase() : "";

    // Check if any gender word is in shoe name or category
    return normalizedGenders.some((gender) => {
      // Direct inclusion check
      if (
        shoeNameLower.includes(gender) ||
        shoeCategoryLower.includes(gender)
      ) {
        return true;
      }

      // Check for pattern variations in category (e.g., "Women's shoes", "Men's Shoes")
      const genderVariations = [
        gender + "'s shoes",
        gender + "s shoes",
        gender + " shoes",
      ];

      return genderVariations.some((variation) =>
        shoeCategoryLower.includes(variation)
      );
    });
  });
}

/**
 * Find shoes marked as best sellers
 * @param {string} message - Lowercase user message
 * @param {Array} inventory - Array of shoe objects
 * @returns {Array} Matching best seller shoes
 */
function findBestSellerMatches(message, inventory) {
  // Check if message contains "best seller" related terms
  const bestSellerTerms = [
    "best seller",
    "bestseller",
    "best selling",
    "bestselling",
    "most popular",
    "top selling",
    "popular",
    "trending",
    "top rated",
    "most bought",
    "best shoes",
  ];

  const hasBestSellerMention = bestSellerTerms.some((term) =>
    message.includes(term)
  );

  if (!hasBestSellerMention) return [];

  logger.debug("Looking for best seller shoes");

  // Filter inventory to match the bestSeller field exactly as defined in your schema
  const bestSellerShoes = inventory.filter(
    (shoe) => shoe.bestSeller === true || shoe.bestSeller === "true"
  );

  // Log how many matches we found for debugging
  logger.debug(`Found ${bestSellerShoes.length} shoes with bestSeller=true`);

  return bestSellerShoes;
}

/**
 * Extract brand mentions from message
 */
function extractBrands(message, inventory) {
  const brands = [
    ...new Set(
      inventory
        .filter((shoe) => shoe.brand)
        .map((shoe) => shoe.brand.toLowerCase())
    ),
  ];

  return brands.filter((brand) => message.includes(brand));
}

/**
 * Extract gender mentions from message
 */
function extractGender(message) {
  const genderKeywords = [
    "men",
    "men's",
    "mens",
    "male",
    "man",
    "man's",
    "mans",
    "women",
    "women's",
    "womens",
    "female",
    "woman",
    "woman's",
    "womans",
    "unisex",
    "kids",
    "children",
    "child",
    "boy",
    "girl",
    "boys",
    "girls",
  ];

  // Match both standalone gender words and gender words followed by "shoes"
  return genderKeywords.filter(
    (keyword) =>
      message.includes(keyword) ||
      message.includes(keyword + "'s") ||
      message.includes(keyword + "s") ||
      message.includes(keyword + "'s shoes") ||
      message.includes(keyword + "s shoes") ||
      message.includes(keyword + " shoes")
  );
}

/**
 * Extract category mentions from message
 */
function extractCategory(message) {
  const categoryKeywords = [
    "running",
    "basketball",
    "casual",
    "formal",
    "sport",
    "athletic",
    "training",
    "walking",
    "hiking",
    "outdoor",
    "lifestyle",
    "skateboarding",
    "tennis",
    "football",
    "soccer",
    "golf",
    "gym",
    "fitness",
    "sneaker",
  ];

  return categoryKeywords.filter((keyword) => message.includes(keyword));
}

/**
 * Apply color filters to a set of shoes
 */
function applyColorFilters(shoes, colorFilters) {
  if (!colorFilters || colorFilters.length === 0) {
    return shoes;
  }

  const filteredShoes = shoes.filter((shoe) => {
    // If shoe has no colors defined, skip color filtering
    if (!shoe.colors || !Array.isArray(shoe.colors)) return true;

    // Check if any requested color matches any color of the shoe
    return colorFilters.some((color) =>
      shoe.colors.some(
        (shoeColor) => shoeColor.toLowerCase() === color.toLowerCase()
      )
    );
  });

  // Only use color filtered results if we found some
  return filteredShoes.length > 0 ? filteredShoes : shoes;
}

/**
 * Detect if the user is trying to add something to cart or wishlist
 * @param {string} message - The user message
 * @returns {Object|null} Action object or null if no action detected
 */
function detectActionRequest(message) {
  const lowercaseMsg = message.toLowerCase();

  // Check for explicit command format first (stronger signal)
  const addCartPattern = /add\s+(to\s+)?cart:\s*["'](.+?)["']/i;
  const addWishlistPattern = /add\s+(to\s+)?wishlist:\s*["'](.+?)["']/i;

  const cartMatch = lowercaseMsg.match(addCartPattern);
  if (cartMatch) {
    return {
      type: "cart",
      action: "add",
      message: lowercaseMsg,
      explicitProduct: cartMatch[2],
    };
  }

  const wishlistMatch = lowercaseMsg.match(addWishlistPattern);
  if (wishlistMatch) {
    return {
      type: "wishlist",
      action: "add",
      message: lowercaseMsg,
      explicitProduct: wishlistMatch[2],
    };
  }

  // More specific patterns for add commands
  if (
    /add\s+(?:the\s+)?[\w\s\-]+\s+to\s+(?:my\s+)?cart/i.test(lowercaseMsg) ||
    /put\s+(?:the\s+)?[\w\s\-]+\s+in\s+(?:my\s+)?cart/i.test(lowercaseMsg) ||
    /buy\s+(?:the\s+)?[\w\s\-]+/i.test(lowercaseMsg) ||
    /purchase\s+(?:the\s+)?[\w\s\-]+/i.test(lowercaseMsg)
  ) {
    return { type: "cart", action: "add", message: lowercaseMsg };
  }

  if (
    /add\s+(?:the\s+)?[\w\s\-]+\s+to\s+(?:my\s+)?wishlist/i.test(
      lowercaseMsg
    ) ||
    /save\s+(?:the\s+)?[\w\s\-]+\s+for\s+later/i.test(lowercaseMsg) ||
    /bookmark\s+(?:the\s+)?[\w\s\-]+/i.test(lowercaseMsg) ||
    /save\s+(?:the\s+)?[\w\s\-]+\s+to\s+(?:my\s+)?wishlist/i.test(lowercaseMsg)
  ) {
    return { type: "wishlist", action: "add", message: lowercaseMsg };
  }

  // Less specific patterns - only use as fallbacks
  if (
    (lowercaseMsg.includes("add to cart") ||
      lowercaseMsg.includes("put in cart")) &&
    !lowercaseMsg.includes("remove") &&
    !lowercaseMsg.includes("delete")
  ) {
    return { type: "cart", action: "add", message: lowercaseMsg };
  }

  if (
    (lowercaseMsg.includes("add to wishlist") ||
      lowercaseMsg.includes("save for later")) &&
    !lowercaseMsg.includes("remove") &&
    !lowercaseMsg.includes("delete")
  ) {
    return { type: "wishlist", action: "add", message: lowercaseMsg };
  }

  // Remove operations - these typically work better because they're more explicit
  if (
    (lowercaseMsg.includes("remove") ||
      lowercaseMsg.includes("delete") ||
      lowercaseMsg.includes("take out")) &&
    lowercaseMsg.includes("wishlist")
  ) {
    return { type: "wishlist", action: "remove", message: lowercaseMsg };
  }

  if (
    (lowercaseMsg.includes("remove") ||
      lowercaseMsg.includes("delete") ||
      lowercaseMsg.includes("take out")) &&
    lowercaseMsg.includes("cart")
  ) {
    return { type: "cart", action: "remove", message: lowercaseMsg };
  }

  return null;
}

/**
 * Find the best matching shoe based on user input
 * @param {string} message - The user message
 * @param {string} explicitProduct - Optional explicit product name
 * @param {Array} shoes - Array of available shoes
 * @param {Array} colorFilters - Optional color filters
 * @returns {Object|null} Best matching shoe or null
 */
function findBestMatchingShoe(
  message,
  explicitProduct,
  shoes,
  colorFilters = []
) {
  if (!shoes || !Array.isArray(shoes) || shoes.length === 0) {
    return null;
  }

  // Filter shoes by color if colors are mentioned
  let filteredShoes = shoes;
  if (colorFilters.length > 0) {
    filteredShoes = shoes.filter((shoe) => {
      // If shoe has no colors defined, skip color filtering
      if (!shoe.colors || !Array.isArray(shoe.colors)) return true;

      // Check if any requested color matches any color of the shoe
      return colorFilters.some((requestedColor) =>
        shoe.colors.some(
          (shoeColor) =>
            shoeColor.toLowerCase() === requestedColor.toLowerCase()
        )
      );
    });

    // If no shoes match the color filter, revert to all shoes
    if (filteredShoes.length === 0) {
      logger.debug(
        `No shoes match color filter ${colorFilters.join(
          ", "
        )}, reverting to all shoes`
      );
      filteredShoes = shoes;
    } else {
      logger.debug(
        `Filtered to ${
          filteredShoes.length
        } shoes matching color ${colorFilters.join(", ")}`
      );
    }
  }

  // If explicit product name is provided, use it
  if (explicitProduct) {
    const explicitMatches = filteredShoes.filter(
      (shoe) =>
        shoe.name &&
        (shoe.name.toLowerCase() === explicitProduct.toLowerCase() ||
          shoe.name.toLowerCase().includes(explicitProduct.toLowerCase()))
    );

    if (explicitMatches.length > 0) {
      return explicitMatches[0];
    }
  }

  const lowercaseMsg = message.toLowerCase();

  // For remove operations, use more precise matching
  if (lowercaseMsg.includes("remove") || lowercaseMsg.includes("delete")) {
    // Try to find exact multi-word product names first
    const productPhrases = lowercaseMsg
      .replace(/remove|delete|from|cart|wishlist/g, "")
      .trim()
      .split(/\s+/);

    // Try progressively longer phrases to find match
    for (
      let wordCount = Math.min(5, productPhrases.length);
      wordCount >= 2;
      wordCount--
    ) {
      for (
        let startIdx = 0;
        startIdx <= productPhrases.length - wordCount;
        startIdx++
      ) {
        const searchPhrase = productPhrases
          .slice(startIdx, startIdx + wordCount)
          .join(" ");
        if (searchPhrase.length < 4) continue; // Skip very short phrases

        // Look for products whose name contains this phrase
        const matchingShoes = filteredShoes.filter(
          (shoe) => shoe.name && shoe.name.toLowerCase().includes(searchPhrase)
        );

        if (matchingShoes.length === 1) {
          // Found exactly one match for this phrase
          return matchingShoes[0];
        }
      }
    }
  }

  // Extract potential product names using patterns
  let extractedNames = [];

  // Pattern 1: "add/remove [the] X to/from cart/wishlist"
  const actionPattern =
    /(?:add|remove|delete)\s+(?:the\s+)?([^"]+?)(?:\s+in\s+size\s+\d+(?:\.\d+)?)?(?:\s+(?:to|from)\s+(?:cart|wishlist))/i;
  const actionMatch = lowercaseMsg.match(actionPattern);
  if (actionMatch && actionMatch[1]) {
    extractedNames.push(actionMatch[1].trim());
  }

  // Pattern 2: "buy [the] X" or "purchase [the] X"
  const buyPattern =
    /(?:buy|purchase)\s+(?:the\s+)?([^"]+?)(?:\s+in\s+size\s+\d+(?:\.\d+)?)?(?:$|\s+and|\s+for)/i;
  const buyMatch = lowercaseMsg.match(buyPattern);
  if (buyMatch && buyMatch[1]) {
    extractedNames.push(buyMatch[1].trim());
  }

  // Try extracted names first (most specific)
  for (const name of extractedNames) {
    // Direct match - look for closest match
    const matches = filteredShoes
      .filter((shoe) => shoe.name)
      .map((shoe) => ({
        shoe,
        similarity: calculateStringSimilarity(
          shoe.name.toLowerCase(),
          name.toLowerCase()
        ),
      }))
      .filter((item) => item.similarity > 0.7) // Only consider reasonably good matches
      .sort((a, b) => b.similarity - a.similarity);

    if (matches.length > 0) {
      logger.debug(
        `Matched "${name}" to "${matches[0].shoe.name}" with similarity ${matches[0].similarity}`
      );
      return matches[0].shoe;
    }
  }

  // Brand + model words matching approach
  // Extract brand first
  let detectedBrand = null;
  const brands = [
    ...new Set(
      filteredShoes
        .filter((shoe) => shoe.brand)
        .map((shoe) => shoe.brand.toLowerCase())
    ),
  ];
  for (const brand of brands) {
    if (lowercaseMsg.includes(brand)) {
      detectedBrand = brand;
      break;
    }
  }

  if (detectedBrand) {
    // Get all shoes of this brand
    const brandShoes = filteredShoes.filter(
      (shoe) => shoe.brand && shoe.brand.toLowerCase() === detectedBrand
    );

    // For each shoe, check if its model words appear in the message
    const scoredShoes = brandShoes
      .map((shoe) => {
        if (!shoe.name) return { shoe, score: 0 };

        // Split model name into words and check if they appear in message
        const modelWords = shoe.name.toLowerCase().split(/\s+/);
        let score = 0;

        for (const word of modelWords) {
          if (word.length > 2 && lowercaseMsg.includes(word.toLowerCase())) {
            score += 1;
          }
        }

        return { shoe, score };
      })
      .filter((item) => item.score > 0);

    // Return the shoe with highest match score
    if (scoredShoes.length > 0) {
      scoredShoes.sort((a, b) => b.score - a.score);
      logger.debug(
        `Matched brand=${detectedBrand}, model=${scoredShoes[0].shoe.name} with score ${scoredShoes[0].score}`
      );
      return scoredShoes[0].shoe;
    }

    // If no specific model found but brand is detected, return first shoe of the brand
    return brandShoes[0];
  }

  // As a last resort, look for any shoe name mention
  for (const shoe of filteredShoes) {
    if (shoe.name && lowercaseMsg.includes(shoe.name.toLowerCase())) {
      return shoe;
    }
  }

  // No match found
  return null;
}

module.exports = {
  findMentionedShoes,
  detectActionRequest,
  findBestMatchingShoe,
  extractSizes,
  extractPriceRange,
  findGenderOnlyMatches,
  findBestSellerMatches,
};
