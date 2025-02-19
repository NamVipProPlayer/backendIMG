const ShoesProduct = require("../models/ShoesProduct");

// Get all shoes
const getAllShoes = async (req, res) => {
  try {
    const shoes = await ShoesProduct.find();
    res.status(200).json(shoes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single shoe by ID
const getShoeById = async (req, res) => {
  try {
    const shoe = await ShoesProduct.findById(req.params.shoeId);
    if (!shoe) {
      return res.status(404).json({ message: "Shoe not found" });
    }
    res.status(200).json(shoe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new shoe product
const createShoe = async (req, res) => {
  const {
    fSrc,
    sSrc,
    name,
    brand,
    category,
    description,
    price,
    stock,
    sizes,
    colors,
  } = req.body;

  if (
    !fSrc ||
    !sSrc ||
    !name ||
    !brand ||
    !category ||
    !description ||
    price == null ||
    stock == null
  ) {
    return res.status(400).json({ message: "Required fields are missing" });
  }

  if (price < 0 || stock < 0) {
    return res
      .status(400)
      .json({ message: "Price and stock cannot be negative" });
  }

  const newShoe = new ShoesProduct({
    fSrc,
    sSrc,
    name,
    brand,
    category,
    description,
    price,
    stock,
    sizes,
    colors,
  });

  try {
    const savedShoe = await newShoe.save();
    res.status(201).json(savedShoe);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a shoe product by ID
const updateShoe = async (req, res) => {
  const {
    fSrc,
    sSrc,
    name,
    brand,
    category,
    description,
    price,
    stock,
    sizes,
    colors,
  } = req.body;

  if (price != null && price < 0) {
    return res.status(400).json({ message: "Price cannot be negative" });
  }

  if (stock != null && stock < 0) {
    return res.status(400).json({ message: "Stock cannot be negative" });
  }

  try {
    const updatedShoe = await ShoesProduct.findByIdAndUpdate(
      req.params.shoeId,
      {
        fSrc,
        sSrc,
        name,
        brand,
        category,
        description,
        price,
        stock,
        sizes,
        colors,
      },
      { new: true, runValidators: true }
    );
    if (!updatedShoe) {
      return res.status(404).json({ message: "Shoe not found" });
    }
    res.status(200).json(updatedShoe);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a shoe product by ID
const deleteShoe = async (req, res) => {
  try {
    const deletedShoe = await ShoesProduct.findByIdAndDelete(req.params.shoeId);
    if (!deletedShoe) {
      return res.status(404).json({ message: "Shoe not found" });
    }
    res.status(200).json({ message: "Shoe deleted successfully" });
  } catch (error) {
    console.error("Error deleting shoe:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllShoes,
  getShoeById,
  createShoe,
  updateShoe,
  deleteShoe,
};
