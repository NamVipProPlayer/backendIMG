const express = require("express");
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../middlewares/productMiddleware");

const router = express.Router();

router.get("/", getAllProducts);
router.get("/:prodId", getProductById);
router.post("/", createProduct);
router.put("/:prodId", updateProduct);
router.delete("/:prodId", deleteProduct);

module.exports = router;
