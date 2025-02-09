const express = require("express");
const Product = require("../models/Product");

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

// Create a new product
router.post("/", async (req, res) => {
  const { src, prevSrc, name, price, quantity } = req.body;

  if (!src || !prevSrc || !name || price == null) {
    return res.status(400).json({ message: "Required fields are missing" });
  }

  const newProduct = new Product({ src, prevSrc, name, price, quantity });

  try {
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update product by ID
router.put("/:prodId", async (req, res) => {
  const { src, prevSrc, name, price, quantity } = req.body;

  if (price != null && price < 0) {
    return res.status(400).json({ message: "Price cannot be negative" });
  }

  if (quantity != null && quantity < 0) {
    return res.status(400).json({ message: "Quantity cannot be negative" });
  }

  try {
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
    res.status(400).json({ message: error.message });
  }
});

// Delete product by ID
router.delete("/:prodId", async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.prodId);
    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
