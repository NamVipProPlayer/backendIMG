const Cart = require("../models/Cart");
const ShoesProduct = require("../models/ShoesProduct"); // Assuming this is your product model

// Middleware to verify cart ownership
const cartOwnershipMiddleware = async (req, res, next) => {
  try {
    const cartId = req.params.cartId || req.body.cartId;

    if (!cartId) {
      return res.status(400).json({ message: "Cart ID is required" });
    }

    const cart = await Cart.findById(cartId);

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Check if the logged-in user owns this cart
    if (cart.user.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Access Denied! You can only access your own cart",
      });
    }

    // Attach cart to request for later use
    req.cart = cart;
    next();
  } catch (error) {
    return res.status(500).json({
      message: "Error verifying cart ownership",
      error: error.message,
    });
  }
};

// Middleware to validate product availability and stock
const validateProductMiddleware = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({
        message: "Product ID and quantity are required",
      });
    }

    const product = await ShoesProduct.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if product is available and in stock
    if (!product.isAvailable) {
      return res.status(400).json({ message: "Product is not available" });
    }

    if (product.stock < quantity) {
      return res.status(400).json({
        message: `Only ${product.stock} items available in stock`,
      });
    }

    // Attach product to request for later use
    req.product = product;
    next();
  } catch (error) {
    return res.status(500).json({
      message: "Error validating product",
      error: error.message,
    });
  }
};

// Middleware to validate cart quantity limits
const cartQuantityLimitMiddleware = async (req, res, next) => {
  try {
    const MAX_ITEMS_PER_PRODUCT = 10; // Maximum quantity per product
    const MAX_TOTAL_ITEMS = 50; // Maximum total items in cart

    const { quantity } = req.body;
    let cart = req.cart || (await Cart.findOne({ user: req.user.id }));

    if (quantity > MAX_ITEMS_PER_PRODUCT) {
      return res.status(400).json({
        message: `Cannot add more than ${MAX_ITEMS_PER_PRODUCT} units of a single product`,
      });
    }

    if (cart && cart.items) {
      const totalItems = cart.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      if (totalItems + quantity > MAX_TOTAL_ITEMS) {
        return res.status(400).json({
          message: `Cart cannot exceed ${MAX_TOTAL_ITEMS} total items`,
        });
      }
    }

    next();
  } catch (error) {
    return res.status(500).json({
      message: "Error checking cart limits",
      error: error.message,
    });
  }
};

// Middleware to calculate cart totals
const calculateCartTotalsMiddleware = async (req, res, next) => {
  try {
    let cart =
      req.cart ||
      (await Cart.findOne({ user: req.user.id }).populate("items.product"));

    if (cart && cart.items) {
      const totalAmount = cart.items.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      );
      cart.totalAmount = totalAmount;
      await cart.save();
      req.cart = cart;
    }

    next();
  } catch (error) {
    return res.status(500).json({
      message: "Error calculating cart totals",
      error: error.message,
    });
  }
};

module.exports = {
  cartOwnershipMiddleware,
  validateProductMiddleware,
  cartQuantityLimitMiddleware,
  calculateCartTotalsMiddleware,
};
