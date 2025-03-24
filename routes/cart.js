const express = require("express");
const router = express.Router();
const cartMiddleware = require("../controllers/cartController");
const {authMiddleware} = require("../middlewares/authMiddleware"); // Assuming you have auth middleware

// Apply auth middleware to all cart routes
router.use(authMiddleware);

// Get user's cart
router.get("/", cartMiddleware.getUserCart);

// Add item to cart
router.post("/add", cartMiddleware.addToCart);

// Update cart item quantity
router.put("/update", cartMiddleware.updateCartItem);

// Remove item from cart
router.delete("/remove/:productId", cartMiddleware.removeFromCart);

// Clear cart
router.delete("/clear", cartMiddleware.clearCart);

module.exports = router;
