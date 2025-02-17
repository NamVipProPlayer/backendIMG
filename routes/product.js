const express = require("express");
const Product = require("../models/Product");
const uploadCloud = require("../configs/cloudinary.config");
const router = express.Router();

// Get all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get one product by ID
router.get("/:prodId", async (req, res) => {
  try {
    const product = await Product.findById(req.params.prodId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post(
  "/",
  uploadCloud.fields([{ name: "productIMG", maxCount: 2 }]),
  async (req, res) => {
    try {
      if (!req.files?.productIMG || req.files.productIMG.length < 2) {
        return res.status(400).json({ message: "Two images are required" });
      }
      const { name, price, quantity } = req.body;
      if (!name || price == null) {
        return res.status(400).json({ message: "Required fields are missing" });
      }
      const src = req.files.productIMG[0].path;
      const prevSrc = req.files.productIMG[1].path;
      const newProduct = new Product({ src, prevSrc, name, price, quantity });
      const savedProduct = await newProduct.save();
      res.status(201).json(savedProduct);
    } catch (error) {
      console.error("Error creating product:", error);   
      res.status(500).json({
        message: "Failed to create product",
        error: error.message,
      });
    }
  }
);

// Update product by ID
router.put(
  "/:prodId",
  uploadCloud.fields([{ name: "productIMG", maxCount: 2 }]),
  async (req, res) => {
    try {
      console.log("Received files:", req.files); // Debugging Log

      const { name, price, quantity } = req.body;

      if (
        !req.files ||
        !req.files.productIMG ||
        req.files.productIMG.length < 2
      ) {
        return res.status(400).json({ message: "Two images are required" });
      }

      const src = req.files.productIMG[0].path; // Use `.path` instead of `.url` if needed
      const prevSrc = req.files.productIMG[1].path;

      if (price != null && price < 0) {
        return res.status(400).json({ message: "Price cannot be negative" });
      }

      if (quantity != null && quantity < 0) {
        return res.status(400).json({ message: "Quantity cannot be negative" });
      }

      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.prodId,
        { src, prevSrc, name, price, quantity },
        { new: true, runValidators: true }
      );

      if (!updatedProduct) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.status(200).json(updatedProduct);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(400).json({ message: error.message });
    }
  }
);

// Delete product by ID
router.delete("/:prodId", async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.prodId);
    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
