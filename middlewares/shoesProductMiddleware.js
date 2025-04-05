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
    sale,
    bestSeller,
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

  if (sale != null && (sale < 0 || sale > 100)) {
    return res
      .status(400)
      .json({ message: "Sale percentage must be between 0 and 100" });
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
    ...(sale != null && { sale }),
    ...(bestSeller != null && { bestSeller }),
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
    sale,
    bestSeller,
  } = req.body;

  if (price != null && price < 0) {
    return res.status(400).json({ message: "Price cannot be negative" });
  }

  if (stock != null && stock < 0) {
    return res.status(400).json({ message: "Stock cannot be negative" });
  }

  if (sale != null && (sale < 0 || sale > 100)) {
    return res
      .status(400)
      .json({ message: "Sale percentage must be between 0 and 100" });
  }

  // Create update object with only the fields that are provided
  const updateData = {};
  if (fSrc !== undefined) updateData.fSrc = fSrc;
  if (sSrc !== undefined) updateData.sSrc = sSrc;
  if (name !== undefined) updateData.name = name;
  if (brand !== undefined) updateData.brand = brand;
  if (category !== undefined) updateData.category = category;
  if (description !== undefined) updateData.description = description;
  if (price !== undefined) updateData.price = price;
  if (stock !== undefined) updateData.stock = stock;
  if (sizes !== undefined) updateData.sizes = sizes;
  if (colors !== undefined) updateData.colors = colors;
  if (sale !== undefined) updateData.sale = sale;
  if (bestSeller !== undefined) updateData.bestSeller = bestSeller;

  try {
    const updatedShoe = await ShoesProduct.findByIdAndUpdate(
      req.params.shoeId,
      updateData,
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
