const { initializeAI, getGeminiModel } = require("../services/aiService");
const marked = require("marked");
const { isOffTopic } = require("../utils/chatUtils");
const {
  findMentionedShoes,
  detectActionRequest,
} = require("../services/productFinders");
const { handleActionRequest } = require("../services/actionHandlers");
const {
  prepareShoeInventoryContext,
  prepareUserContext,
} = require("../services/dataFormatters");
const { detectColors, getAllAvailableColors } = require("../utils/colorUtils");
const logger = require("../utils/logger");
const store = require("./policyData.js");
const storePolicies = require("./policyData.js");

// Initialize model once during module load
try {
  initializeAI();
} catch (error) {
  logger.error("Failed to initialize AI model:", error);
}

/**
 * Process chat requests, handle authentication, and generate AI responses
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
exports.processChat = async (req, res) => {
  try {
    // Ensure AI model is initialized
    const model = getGeminiModel();
    if (!model) {
      return res.status(500).json({ error: "AI service unavailable" });
    }

    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Check if user is authenticated
    const isAuthenticated = !!req.user;
    logger.debug(`User authenticated: ${isAuthenticated}`);

    // Check if the message is off-topic
    if (isOffTopic(message)) {
      return res.json({
        response:
          "I'm your shoe shopping assistant. I can only help with questions about our shoes, orders, or shopping experience.",
      });
    }

    // First get all available colors from database for detection
    const availableColors = await getAllAvailableColors();
    logger.debug(
      `Available colors in database: ${availableColors.join(", ") || "none"}`
    );

    // Now detect colors in the message based on database values
    const colorFilters = detectColors(message, availableColors);
    logger.debug(
      `Detected color filters: ${colorFilters.join(", ") || "none"}`
    );

    // Prepare context with inventory and user data
    let contextData = {
      timestamp: new Date().toISOString(),
      colorFilters,
      policies: storePolicies,
    };

    try {
      // Get shoe inventory data
      const inventory = await prepareShoeInventoryContext(colorFilters);
      contextData.inventory = inventory;

      // Add user data if authenticated
      if (isAuthenticated && req.user) {
        logger.debug(`Fetching data for user: ${req.user._id}`);
        const userData = await prepareUserContext(req.user._id);
        contextData.userData = userData;

        // Debug log to check what data we're getting
        if (userData.wishlist) {
          logger.debug(
            `User ${req.user._id} has ${userData.wishlist.length} items in wishlist`
          );
        }
        if (userData.cart) {
          logger.debug(
            `User ${req.user._id} has ${userData.cart.length} items in cart`
          );
        }
      }
    } catch (err) {
      logger.warn("Context preparation error (non-fatal):", err);
      // Continue even if context preparation fails
    }

    // Check if user is trying to add to cart or wishlist
    const actionRequest = detectActionRequest(message);
    if (actionRequest && isAuthenticated) {
      try {
        // Log the detected action for debugging
        logger.debug("Detected action request:", actionRequest);

        const result = await handleActionRequest(
          actionRequest,
          req.user._id,
          colorFilters
        );

        // Log the result of the action
        logger.debug("Action result:", result);

        return res.json(result);
      } catch (actionError) {
        logger.error("Action handling error:", actionError);
        // Continue with normal chat if action fails
      }
    }

    // Simplified chat initialization for gemini-2.0-flash
    const chat = model.startChat();

    // Optimize context data size by limiting inventory items FIRST
    if (contextData.inventory && contextData.inventory.inventory) {
      // Only keep the first 50 products to avoid overloading the context
      contextData.inventory.inventory = contextData.inventory.inventory.slice(0, 50);
    }

    // Find bestseller products before constructing the instructions  
    const bestSellerProducts = contextData.inventory?.inventory
      ? contextData.inventory.inventory.filter(product => {
          // Be more explicit about detecting bestseller products
          const isBestSeller = product.bestSeller === true;
          if (isBestSeller) {
            logger.debug(`Found bestseller: ${product.name} (${product._id})`);
          }
          return isBestSeller;
        })
      : [];

    logger.debug(`Found ${bestSellerProducts.length} bestseller products: ${
      bestSellerProducts.map(p => p.name).join(', ')
    }`);

    // Add this after filtering the bestsellers
    if (bestSellerProducts.length > 0) {
      // Create a special section for bestsellers that won't get lost in the context
      contextData.specialCollections = {
        bestSellers: bestSellerProducts.map(p => ({
          id: p._id,
          name: p.name,
          brand: p.brand,
          price: p.price,
          sale: p.sale
        }))
      };
      
      logger.debug(`Added ${bestSellerProducts.length} bestsellers to specialCollections`);
    }

    // Find products on sale before constructing the instructions
    const saleProducts = contextData.inventory?.inventory
      ? contextData.inventory.inventory
          .filter((product) => product.sale && product.sale > 0)
          .sort((a, b) => b.sale - a.sale) // Sort by highest discount first
      : [];

    // Log what we found for debugging
    logger.debug(`Found ${bestSellerProducts.length} bestseller products`);
    logger.debug(`Found ${saleProducts.length} products on sale`);

    const policyQuestionType = detectActionRequest(message);
    // Include instructions and context with the user message
    const instructionsForBot = `
You are a helpful shoe store assistant. Please follow these rules:
1. Only talk about shoes, shopping, and our store
2. If asked about weather, news, or other off-topic things, say: "I'm your shoe shopping assistant. I can only help with questions about our shoes, orders, or shopping experience."
3. Be knowledgeable about shoe brands, styles, materials, sale, bestSeller, and sizing.

${
  bestSellerProducts.length > 0
    ? `4. CRITICAL INSTRUCTION: Users are asking about bestseller products. You MUST recommend THESE EXACT bestseller products:
  ${bestSellerProducts
    .slice(0, 5)
    .map(
      (p, i) =>
        `${i+1}. ${p.brand} ${p.name}: $${p.price}${
          p.sale > 0 ? ` (${p.sale}% off)` : ""
        }`
    )
    .join("\n  ")}
  
  IMPORTANT: When asked about best sellers or popular shoes, ALWAYS mention these specific products by name and say they are our current bestsellers.
`
    : ""
}

${
  // Add specific instructions about sale products
  saleProducts.length > 0
    ? `5. IMPORTANT: When users ask about sales, discounts, or deals, highlight these products with the best discounts:
  ${saleProducts
    .slice(0, 5)
    .map(
      (p) =>
        `- ${p.brand} ${p.name}: $${p.price} (${p.sale}% off, original price $${
          Math.round((p.price / (1 - p.sale / 100)) * 100) / 100
        })`
    )
    .join("\n  ")}
`
    : ""
}

${
  policyQuestionType
    ? `${
        bestSellerProducts.length > 0 || saleProducts.length > 0 ? "6" : "4"
      }. The user is asking about our ${policyQuestionType} policy. Provide the correct information from contextData.policies.
   - For return policy: Explain our ${
     contextData.policies.returnPolicy.days
   }-day return policy and conditions.
   - For shipping: Explain delivery times (${
     contextData.policies.shipping.localCity.time
   } for local city, ${
        contextData.policies.shipping.outsideCity.time
      } outside the city, ${
        contextData.policies.shipping.international.time
      } international) and costs.
   - For warranty: Explain our ${
     contextData.policies.warranty.standard
   } and options for extended coverage.
   Be friendly and thorough when explaining policies.
`
    : ""
}

${
  isAuthenticated
    ? `${
        bestSellerProducts.length > 0 ||
        saleProducts.length > 0 ||
        policyQuestionType
          ? "7"
          : "5"
      }. You can provide info about the user's orders, cart, and wishlist.
${
  bestSellerProducts.length > 0 || saleProducts.length > 0 || policyQuestionType
    ? "8"
    : "6"
}. You can help add items to cart/wishlist.
${
  bestSellerProducts.length > 0 || saleProducts.length > 0 || policyQuestionType
    ? "9"
    : "7"
}. IMPORTANT: When asked about wishlisted items, check contextData.userData.wishlist array. If this array exists and has items, list those items. Only say the wishlist is empty if contextData.userData.wishlist is empty or has length 0.
${
  bestSellerProducts.length > 0 || saleProducts.length > 0 || policyQuestionType
    ? "10"
    : "8"
}. IMPORTANT: When asked about cart items, check contextData.userData.cart array. If this array exists and has items, list those items. Only say the cart is empty if contextData.userData.cart is empty or has length 0.`
    : `${
        bestSellerProducts.length > 0 ||
        saleProducts.length > 0 ||
        policyQuestionType
          ? "7"
          : "5"
      }. Ask users to log in to access personal information.
${
  bestSellerProducts.length > 0 || saleProducts.length > 0 || policyQuestionType
    ? "8"
    : "6"
}. Don't add items to cart/wishlist for non-logged users.`
}
${
  bestSellerProducts.length > 0 || saleProducts.length > 0 || policyQuestionType
    ? "11"
    : "9"
}. If the user asked about shoes of a specific color, acknowledge the color in your response.
${
  bestSellerProducts.length > 0 || saleProducts.length > 0 || policyQuestionType
    ? "12"
    : "10"
}. Today's date is ${
      new Date().toISOString().split("T")[0]
    }. Use this when discussing return eligibility.

Available Context: {
  "specialCollections": ${JSON.stringify(contextData.specialCollections || {})},
  "policies": ${JSON.stringify(contextData.policies || {})},
  "userData": ${JSON.stringify(contextData.userData || {})}
}

USER QUERY: ${message}

Remember to stay focused only on shoes and shopping!`;

    // Send the complete message
    const result = await chat.sendMessage(instructionsForBot);
    const botResponse = result.response.text();
    // Convert markdown to HTML
    const formattedResponse = marked.parse(botResponse);

    // Find any mentioned shoes to include in response
    const mentionedShoes = findMentionedShoes(
      message,
      contextData.inventory?.inventory || [],
      colorFilters
    );

    res.json({
      response: formattedResponse,
      shoes: mentionedShoes,
    });
  } catch (error) {
    logger.error("Chat processing error:", error);
    res.status(500).json({
      error: "Failed to process your request",
      details: error.message,
    });
  }
};
