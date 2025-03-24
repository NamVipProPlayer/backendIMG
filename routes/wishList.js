const express = require("express");
const router = express.Router();
const {
  getWishList,
  addToWishList,
  removeFromWishList,
  wishListLimitMiddleware,
  productInWishListMiddleware,
} = require("../middlewares/wishlistMiddleware.js");
const { authMiddleware } = require("../middlewares/authMiddleware"); 

// Get the user's wishlist
router.get("/", authMiddleware, getWishList);

// Add a product to the wishlist (with limit check)
router.post("/add", authMiddleware, wishListLimitMiddleware, addToWishList);

// Remove a product from the wishlist
router.delete("/:productId", authMiddleware,productInWishListMiddleware, removeFromWishList);

module.exports = router;
