const express = require("express");
const {
  getAllShoes,
  getShoeById,
  createShoe,
  updateShoe,
  deleteShoe,
  searchShoes,
  getSuggestions,
} = require("../middlewares/shoesProductMiddleware");

const router = express.Router();

router.get("/", getAllShoes);
router.get("/:shoeId", getShoeById);
router.post("/", createShoe);
router.put("/:shoeId", updateShoe);
router.delete("/:shoeId", deleteShoe);
router.get("/search/shoes", searchShoes);
router.get("/search/suggestions", getSuggestions);

module.exports = router;
