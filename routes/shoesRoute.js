const express = require("express");
const {
  getAllShoes,
  getShoeById,
  createShoe,
  updateShoe,
  deleteShoe,
} = require("../middlewares/shoesProductMiddleware");

const router = express.Router();

router.get("/", getAllShoes);
router.get("/:shoeId", getShoeById);
router.post("/", createShoe);
router.put("/:shoeId", updateShoe);
router.delete("/:shoeId", deleteShoe);

module.exports = router;
