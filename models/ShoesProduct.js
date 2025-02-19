const mongoose = require("mongoose");

const ShoesSchema = new mongoose.Schema({
  fSrc: { type: String, required: true },
  sSrc: { type: String, required: true },
  name: { type: String, required: true },
  brand: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
  sizes: [{ type: Number, required: true }], // Array of available sizes
  colors: [{ type: String, required: true }], // Array of available colors
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ShoesProduct", ShoesSchema);
