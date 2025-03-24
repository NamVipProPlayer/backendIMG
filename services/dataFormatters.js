const ShoesProduct = require("../models/ShoesProduct");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const WishList = require("../models/WishList");
const logger = require("../utils/logger");
const { getAllAvailableColors } = require("../utils/colorUtils");

/**
 * Prepare context with shoe inventory data
 * @param {Array} colorFilters - Optional array of color filters
 * @returns {Object} Inventory context object
 */
async function prepareShoeInventoryContext(colorFilters = []) {
  try {
    let query = {};

    // Apply color filters if present
    if (colorFilters && colorFilters.length > 0) {
      // Use $in operator for color matches
      query.colors = { $in: colorFilters };
    }

    const shoes = await ShoesProduct.find(query)
      .select("fSrc name brand price sizes colors inStock description category")
      .limit(30)
      .lean();

    // Get all available colors for context
    const availableColors = await getAllAvailableColors();

    return {
      inventory: shoes,
      brands: [...new Set(shoes.map((shoe) => shoe.brand).filter(Boolean))],
      sizeRange: getMinMaxSizes(shoes),
      categories: [
        ...new Set(shoes.map((shoe) => shoe.category).filter(Boolean)),
      ],
      availableColors,
      filteredBy: colorFilters.length > 0 ? { colors: colorFilters } : null,
    };
  } catch (error) {
    logger.error("Error fetching inventory:", error);
    return {
      inventory: [],
      brands: [],
      sizeRange: {},
      categories: [],
      availableColors: [],
    };
  }
}

/**
 * Calculate the min and max sizes from shoe inventory
 * @param {Array} shoes - Array of shoe objects
 * @returns {Object} Min and max sizes
 */
function getMinMaxSizes(shoes) {
  let allSizes = [];
  shoes.forEach((shoe) => {
    if (shoe.sizes && Array.isArray(shoe.sizes)) {
      allSizes = [...allSizes, ...shoe.sizes];
    }
  });

  if (allSizes.length === 0) return { min: 0, max: 0 };
  return {
    min: Math.min(...allSizes),
    max: Math.max(...allSizes),
  };
}

/**
 * Prepare context with user's orders, cart and wishlist
 * @param {string} userId - The user's ID
 * @returns {Object} User context object
 */
async function prepareUserContext(userId) {
  try {
    logger.debug(`Preparing context for user: ${userId}`);

    // Run database queries in parallel for better performance
    const [orders, cart, wishlist] = await Promise.all([
      // Get orders with populated product details
      Order.find({ user: userId, isDeleted: { $ne: true } })
        .sort({ orderedAt: -1 })
        .populate("items.product")
        .lean(),

      // Get cart with populated product details
      Cart.findOne({ user: userId }).populate("items.product").lean(),

      // Get wishlist with populated product details
      WishList.findOne({ user: userId }).populate("products.product").lean(),
    ]);

    // Process orders
    const processedOrders = orders.map((order) => ({
      id: order._id,
      status: order.orderStatus,
      paymentStatus: order.paymentStatus,
      totalAmount: order.finalAmount,
      date: order.orderedAt,
      items: order.items.map((item) => ({
        name: item.product?.name || "Unknown product",
        size: item.size,
        quantity: item.quantity,
        price: item.price,
      })),
    }));

    // Process cart
    let processedCart = [];
    if (cart && cart.items && cart.items.length > 0) {
      processedCart = cart.items.map((item) => ({
        name: item.product?.name || "Unknown product",
        size: item.size,
        quantity: item.quantity,
        price: item.price,
      }));
    }

    // Process wishlist - ensuring we properly handle the nested structure
    let processedWishlist = [];
    if (wishlist && wishlist.products && wishlist.products.length > 0) {
      processedWishlist = wishlist.products
        .filter((item) => item.product) // Ensure product exists
        .map((item) => ({
          name: item.product.name,
          brand: item.product.brand,
          price: item.product.price,
          addedAt: item.addedAt,
        }));
    }

    return {
      orders: processedOrders,
      cart: processedCart,
      wishlist: processedWishlist,
    };
  } catch (error) {
    logger.error("Error fetching user data:", error);
    return { orders: [], cart: [], wishlist: [] };
  }
}

module.exports = {
  prepareShoeInventoryContext,
  prepareUserContext,
  getMinMaxSizes,
};
