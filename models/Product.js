const mongoose = require("mongoose");

const ProdSchema = new mongoose.Schema(
  {
    src: { type: String, required: true },
    prevSrc: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProdSchema);
