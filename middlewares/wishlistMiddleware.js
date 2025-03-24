const WishList = require("../models/WishList");
const mongoose = require("mongoose");

// Middleware to verify wishlist ownership
exports.wishListOwnershipMiddleware = async (req, res, next) => {
  try {
    const wishListId = req.params.wishListId || req.body.wishListId;

    if (!wishListId || !mongoose.Types.ObjectId.isValid(wishListId)) {
      return res
        .status(400)
        .json({ message: "Invalid or missing Wishlist ID" });
    }

    const wishList = await WishList.findById(wishListId);
    if (!wishList) {
      return res.status(404).json({ message: "Wishlist not found" });
    }

    if (wishList.user.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Access Denied! You can only access your own wishlist",
      });
    }

    req.wishList = wishList;
    next();
  } catch (error) {
    console.error("Wishlist Ownership Middleware Error:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// Middleware to verify if product exists in wishlist
exports.productInWishListMiddleware = async (req, res, next) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const wishList =
      req.wishList || (await WishList.findOne({ user: req.user.id }));
    if (!wishList) {
      return res.status(404).json({ message: "Wishlist not found" });
    }

    const productExists = wishList.products.some(
      (item) => item.product.toString() === productId
    );

    req.productExists = productExists;
    next();
  } catch (error) {
    console.error("Product Check Middleware Error:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// Middleware to check wishlist limit
exports.wishListLimitMiddleware = async (req, res, next) => {
  try {
    const wishList =
      req.wishList || (await WishList.findOne({ user: req.user.id }));

    if (wishList && wishList.products.length >= 100) {
      return res
        .status(400)
        .json({ message: "Wishlist cannot exceed 100 items" });
    }

    next();
  } catch (error) {
    console.error("Wishlist Limit Middleware Error:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// Get Wishlist
exports.getWishList = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const wishList = await WishList.findOne({ user: req.user.id }).populate(
      "products.product"
    );

    if (!wishList || wishList.products.length === 0) {
      return res.status(404).json({ message: "Wishlist is empty" });
    }

    res.json(wishList);
  } catch (error) {
    console.error("Get Wishlist Error:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// Add to Wishlist
exports.addToWishList = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { productId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const updatedWishList = await WishList.findOneAndUpdate(
      { user: req.user.id },
      { $addToSet: { products: { product: productId } } },
      { new: true, upsert: true }
    ).populate("products.product");

    res.status(201).json(updatedWishList);
  } catch (error) {
    console.error("Add to Wishlist Error:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};

// Remove from Wishlist
exports.removeFromWishList = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const updatedWishList = await WishList.findOneAndUpdate(
      { user: req.user.id },
      { $pull: { products: { product: productId } } },
      { new: true }
    );

    if (!updatedWishList) {
      return res.status(404).json({ message: "Wishlist not found" });
    }

    res.json({ message: "Product removed from wishlist" });
  } catch (error) {
    console.error("Remove from Wishlist Error:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};
