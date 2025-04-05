const Cart = require("../models/Cart");
const WishList = require("../models/WishList");
const ShoesProduct = require("../models/ShoesProduct");
const logger = require("../utils/logger");
const { findBestMatchingShoe } = require("./productFinders");

/**
 * Handle adding items to cart or wishlist
 * @param {Object} request - The action request
 * @param {string} userId - The user's ID
 * @param {Array} colorFilters - Optional color filters
 * @returns {Object} Response object
 */
async function handleActionRequest(request, userId, colorFilters = []) {
  try {
    const { type, action, message, explicitProduct } = request;

    // Get all shoes to match against
    let query = {};
    
    // Apply color filters if present for finding matching shoes
    if (colorFilters && colorFilters.length > 0) {
      query.colors = { $in: colorFilters };
    }
    
    const shoes = await ShoesProduct.find(query).lean();

    // Use improved matching algorithm
    const targetShoe = findBestMatchingShoe(message, explicitProduct, shoes, colorFilters);

    if (!targetShoe) {
      return {
        response:
          "I couldn't identify which shoe you want to modify. Try saying something like 'Add Nike Air Max to cart' or specify the shoe name more clearly.",
      };
    }

    logger.debug(
      `Found shoe: ${targetShoe.name} for action: ${action} on ${type}`
    );

    // Check if shoe is in stock before proceeding
    if (action === "add" && type === "cart" && targetShoe.stock <= 0) {
      return {
        response: `I'm sorry, the ${targetShoe.name} is currently out of stock. Would you like to add it to your wishlist instead?`,
      };
    }

    // Extract size if mentioned (for cart operations)
    let size = null;
    const sizePattern =
      /size\s+(\d+(\.\d+)?)|size[:\s-]+(\d+(\.\d+)?)|(\d+(\.\d+)?)\s+size/i;
    const sizeMatch = message.match(sizePattern);
    if (sizeMatch) {
      size = parseFloat(sizeMatch[1] || sizeMatch[3] || sizeMatch[5]);
      logger.debug(`Detected size: ${size}`);
    }

    // Handle based on type and action
    if (type === "cart") {
      return await handleCartAction(userId, action, targetShoe, size);
    } else if (type === "wishlist") {
      return await handleWishlistAction(userId, action, targetShoe);
    }

    return {
      response:
        "I'm not sure what you want to do with this shoe. Please try again with a clearer request.",
    };
  } catch (error) {
    logger.error("Error handling action request:", error);
    return {
      response:
        "I'm sorry, I couldn't process your request at this moment. Please try again later.",
      error: error.message,
    };
  }
}

/**
 * Handle cart actions (add/remove)
 * @param {string} userId - User ID
 * @param {string} action - "add" or "remove"
 * @param {Object} targetShoe - Shoe to target
 * @param {number} size - Optional shoe size
 * @returns {Object} Response object
 */
async function handleCartAction(userId, action, targetShoe, size = null) {
  // Find user's cart
  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    if (action === "remove") {
      return {
        response: "You don't have any items in your cart.",
      };
    }

    // For "add" action, create new cart
    cart = new Cart({
      user: userId,
      items: [],
      totalAmount: 0,
    });
  }

  if (action === "add") {
    // Check if size is available
    if (size && targetShoe.sizes && !targetShoe.sizes.includes(size)) {
      return {
        response: `Sorry, the ${
          targetShoe.name
        } is not available in size ${size}. Available sizes are: ${targetShoe.sizes.join(
          ", "
        )}.`,
      };
    }

    // If no size specified and multiple sizes available, ask user for size preference
    if (!size && targetShoe.sizes && targetShoe.sizes.length > 1) {
      return {
        response: `What size would you like for the ${
          targetShoe.name
        }? Available sizes are: ${targetShoe.sizes.join(", ")}.`,
        pendingAction: {
          type: "cart",
          action: "add",
          shoeId: targetShoe._id,
          shoeName: targetShoe.name,
        },
      };
    }

    // Use the first available size if none specified and only one size available
    const selectedSize = size || (targetShoe.sizes && targetShoe.sizes[0]);

    // Check if item already in cart
    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.product &&
        item.product.toString() === targetShoe._id.toString() &&
        item.size === selectedSize
    );

    if (existingItemIndex >= 0) {
      // Update existing item
      cart.items[existingItemIndex].quantity += 1;
      logger.debug(`Updated quantity for ${targetShoe.name} in cart`);
    } else {
      // Calculate the original price from sale percentage
      const originalPrice = targetShoe.sale > 0 
        ? Math.round((targetShoe.price / (1 - targetShoe.sale/100)) * 100) / 100
        : targetShoe.price;

      // Add new item with originalPrice
      cart.items.push({
        product: targetShoe._id,
        size: selectedSize,
        quantity: 1,
        price: targetShoe.price,
        originalPrice: originalPrice,
      });
      logger.debug(`Added new item ${targetShoe.name} to cart`);
    }

    // Recalculate total
    cart.totalAmount = cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    // Save cart
    await cart.save();
    logger.debug(`Cart saved successfully with ${cart.items.length} items`);

    return {
      response: `I've added the ${targetShoe.name} in size ${selectedSize} to your cart.`,
      actionTaken: {
        type: "cart",
        action: "add",
        shoe: targetShoe,
        size: selectedSize,
      },
    };
  } else if (action === "remove") {
    // Handle removal from cart
    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.product &&
        item.product.toString() === targetShoe._id.toString() &&
        (size ? item.size === size : true)
    );

    if (existingItemIndex === -1) {
      return {
        response: `I couldn't find the ${targetShoe.name} ${
          size ? `in size ${size} ` : ""
        }in your cart.`,
      };
    }

    // Remove the item
    cart.items.splice(existingItemIndex, 1);

    // Recalculate total
    cart.totalAmount = cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    // Save updated cart
    await cart.save();

    return {
      response: `I've removed the ${targetShoe.name} ${
        size ? `in size ${size} ` : ""
      }from your cart.`,
      actionTaken: {
        type: "cart",
        action: "remove",
        shoe: targetShoe,
      },
    };
  }
  
  return {
    response: "Invalid cart action.",
  };
}

/**
 * Handle wishlist actions (add/remove)
 * @param {string} userId - User ID
 * @param {string} action - "add" or "remove"
 * @param {Object} targetShoe - Shoe to target
 * @returns {Object} Response object
 */
async function handleWishlistAction(userId, action, targetShoe) {
  // Handle wishlist actions
  let wishlist = await WishList.findOne({ user: userId });

  if (!wishlist) {
    if (action === "remove") {
      return {
        response: "You don't have any items in your wishlist.",
      };
    }

    // For "add" action, create new wishlist
    wishlist = new WishList({
      user: userId,
      products: [],
    });
  }

  if (action === "add") {
    // Check if product already in wishlist
    const existingItemIndex = wishlist.products.findIndex(
      (item) =>
        item.product && item.product.toString() === targetShoe._id.toString()
    );

    if (existingItemIndex === -1) {
      // Add to wishlist
      wishlist.products.push({
        product: targetShoe._id,
        addedAt: new Date(),
      });

      // Save wishlist
      await wishlist.save();
      logger.debug(`Added ${targetShoe.name} to wishlist successfully`);
    } else {
      logger.debug(`${targetShoe.name} already exists in wishlist`);
    }

    return {
      response: `I've added the ${targetShoe.name} to your wishlist.`,
      actionTaken: {
        type: "wishlist",
        action: "add",
        shoe: targetShoe,
      },
    };
  } else if (action === "remove") {
    // Handle removal from wishlist
    const existingItemIndex = wishlist.products.findIndex(
      (item) =>
        item.product && item.product.toString() === targetShoe._id.toString()
    );

    if (existingItemIndex === -1) {
      return {
        response: `I couldn't find the ${targetShoe.name} in your wishlist.`,
      };
    }

    // Remove the item
    wishlist.products.splice(existingItemIndex, 1);

    // Save updated wishlist
    await wishlist.save();

    return {
      response: `I've removed the ${targetShoe.name} from your wishlist.`,
      actionTaken: {
        type: "wishlist",
        action: "remove",
        shoe: targetShoe,
      },
    };
  }

  return {
    response: "Invalid wishlist action.",
  };
}

module.exports = {
  handleActionRequest,
  handleCartAction,
  handleWishlistAction,
};