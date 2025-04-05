const Cart = require("../models/Cart");
const ShoesProduct = require("../models/ShoesProduct");
const cartMiddleware = {
  // Get cart for authenticated user
  getUserCart: async (req, res, next) => {
    try {
      const userId = req.user.id; // Using id from JWT decoded user

      const cart = await Cart.findOne({ user: userId })
        .populate("items.product")
        .populate("user", "name email phone");

      if (!cart) {
        // Create new cart if doesn't exist
        const newCart = new Cart({
          user: userId,
          items: [],
          totalAmount: 0,
          updatedAt: new Date(),
        });
        await newCart.save();
        return res.status(200).json(newCart);
      }

      res.status(200).json(cart);
    } catch (error) {
      console.error("Get Cart Error:", error);
      next(error);
    }
  },

  // Add or update item in cart
  // Add or update item in cart
  addToCart: async (req, res, next) => {
    try {
      const { productId, size, quantity } = req.body;
      const userId = req.user.id;

      // Validate request body
      if (!productId || !size || !quantity) {
        return res.status(400).json({
          message: "Product ID, size, and quantity are required",
        });
      }

      if (quantity < 1) {
        return res.status(400).json({
          message: "Quantity must be at least 1",
        });
      }

      // Fetch the product from the database
      const product = await ShoesProduct.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Store original price
      const originalPrice = product.price;

      // Determine the actual price based on sale status
      let actualPrice = originalPrice;

      // Check if the product has a sale
      if (product.sale && product.sale > 0) {
        // Calculate the discounted price
        actualPrice = originalPrice * (1 - product.sale / 100);
        // Round to 2 decimal places for currency
        actualPrice = Math.round(actualPrice * 100) / 100;
      }

      let cart = await Cart.findOne({ user: userId });

      if (!cart) {
        cart = new Cart({
          user: userId,
          items: [],
          totalAmount: 0,
        });
      }

      // Check if the same product with the same size already exists in the cart
      const existingItemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId && item.size === size
      );

      if (existingItemIndex > -1) {
        cart.items[existingItemIndex].quantity += quantity;
        cart.items[existingItemIndex].price = actualPrice; // Use sale price if applicable
        cart.items[existingItemIndex].originalPrice = originalPrice; // Add original price
      } else {
        const newItem = {
          product: productId,
          size,
          quantity,
          price: actualPrice, // Use sale price if applicable
          originalPrice: originalPrice, // Add original price
        };

        cart.items.push(newItem);
      }

      // Recalculate total amount
      cart.totalAmount = cart.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );
      cart.updatedAt = new Date();

      await cart.save();

      const populatedCart = await Cart.findById(cart._id)
        .populate("items.product")
        .populate("user", "name email phone");

      res.status(200).json(populatedCart);
    } catch (error) {
      console.error("Add to Cart Error:", error);
      next(error);
    }
  },

  // Update cart item quantity
  updateCartItem: async (req, res, next) => {
    try {
      const { productId, quantity, size } = req.body;
      const userId = req.user.id;

      // Check if at least one update parameter is provided
      if (!productId || (quantity === undefined && size === undefined)) {
        return res.status(400).json({
          message:
            "Product ID and at least one update parameter (quantity or size) are required",
        });
      }

      const cart = await Cart.findOne({ user: userId });

      if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
      }

      const itemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId
      );

      if (itemIndex === -1) {
        return res.status(404).json({ message: "Item not found in cart" });
      }

      // Handle quantity updates
      if (quantity !== undefined) {
        if (quantity <= 0) {
          // Remove item if quantity is zero or negative
          cart.items.splice(itemIndex, 1);
        } else {
          cart.items[itemIndex].quantity = quantity;
        }
      }

      // Handle size updates (only if item wasn't removed due to quantity)
      if (size !== undefined && (quantity === undefined || quantity > 0)) {
        cart.items[itemIndex].size = size;
      }

      // Only recalculate total if items remain
      if (cart.items.length > 0) {
        cart.totalAmount = cart.items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      } else {
        cart.totalAmount = 0;
      }

      cart.updatedAt = new Date();

      await cart.save();

      const populatedCart = await Cart.findById(cart._id)
        .populate("items.product")
        .populate("user", "name email phone");

      res.status(200).json(populatedCart);
    } catch (error) {
      console.error("Update Cart Error:", error);
      next(error);
    }
  },

  // Remove item from cart
  removeFromCart: async (req, res, next) => {
    try {
      const { productId } = req.params;
      const { size } = req.body; // Get size from request body
      const userId = req.user.id;

      if (!productId) {
        return res.status(400).json({
          message: "Product ID is required",
        });
      }

      if (!size) {
        return res.status(400).json({
          message: "Size is required",
        });
      }

      const cart = await Cart.findOne({ user: userId });

      if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
      }

      const initialLength = cart.items.length;

      // Filter items based on both product ID and size
      cart.items = cart.items.filter(
        (item) => !(item.product.toString() === productId && item.size === size)
      );

      if (cart.items.length === initialLength) {
        return res.status(404).json({ message: "Item not found in cart" });
      }

      // Recalculate total amount
      cart.totalAmount = cart.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );
      cart.updatedAt = new Date();

      await cart.save();

      const populatedCart = await Cart.findById(cart._id)
        .populate("items.product")
        .populate("user", "name email phone");

      res.status(200).json(populatedCart);
    } catch (error) {
      console.error("Remove from Cart Error:", error);
      next(error);
    }
  },

  // Clear cart
  clearCart: async (req, res, next) => {
    try {
      const userId = req.user.id;

      const cart = await Cart.findOne({ user: userId });

      if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
      }

      cart.items = [];
      cart.totalAmount = 0;
      cart.updatedAt = new Date();

      await cart.save();

      res.status(200).json({
        message: "Cart cleared successfully",
        cart,
      });
    } catch (error) {
      console.error("Clear Cart Error:", error);
      next(error);
    }
  },
};

module.exports = cartMiddleware;
