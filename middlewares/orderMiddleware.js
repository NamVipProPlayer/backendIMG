const Order = require("../models/Order");
const mongoose = require("mongoose");

// Middleware to validate order ID format
const validateOrderId = (req, res, next) => {
  const orderId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid order ID format" });
  }

  next();
};

// Middleware to check if order exists
const checkOrderExists = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (order.isDeleted) {
      return res
        .status(404)
        .json({ success: false, message: "Order has been deleted" });
    }

    // Attach order to request object
    req.order = order;
    next();
  } catch (error) {
    console.error("Error checking order existence:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Middleware to verify order ownership
const verifyOrderOwnership = async (req, res, next) => {
  try {
    // Only proceed if we have both an order and authenticated user
    if (!req.order || !req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized access" });
    }

    // Check if the authenticated user is the owner of the order
    if (req.order.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({
          success: false,
          message: "You don't have permission to access this order",
        });
    }

    next();
  } catch (error) {
    console.error("Error verifying order ownership:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Middleware to validate order input
const validateOrderInput = (req, res, next) => {
  const { items, shippingAddress, paymentMethod } = req.body;

  // Validate items array
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Order must contain at least one item",
    });
  }

  // Validate each item
  for (const item of items) {
    if (!item.product || !item.size || !item.quantity || !item.price) {
      return res.status(400).json({
        success: false,
        message: "Each item must include product, size, quantity, and price",
      });
    }

    if (item.quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Item quantity must be at least 1",
      });
    }
  }

  // Validate shipping address
  if (
    !shippingAddress ||
    typeof shippingAddress !== "object" ||
    !shippingAddress.houseNumber ||
    !shippingAddress.street ||
    !shippingAddress.ward ||
    !shippingAddress.district ||
    !shippingAddress.cityOrProvince ||
    !shippingAddress.phoneNumber
  ) {
    return res.status(400).json({
      success: false,
      message: "Complete shipping address is required",
    });
  }

  // Validate payment method
  const validPaymentMethods = [
    "Credit Card",
    "PayPal",
    "Cash on Delivery",
    "VNPay",
  ];
  if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
    return res.status(400).json({
      success: false,
      message: `Payment method must be one of: ${validPaymentMethods.join(
        ", "
      )}`,
    });
  }

  next();
};

// Middleware to validate status update
const validateStatusUpdate = (req, res, next) => {
  const { orderStatus, paymentStatus } = req.body;

  if (orderStatus) {
    const validOrderStatuses = [
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];
    if (!validOrderStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order status must be one of: ${validOrderStatuses.join(
          ", "
        )}`,
      });
    }
  }

  if (paymentStatus) {
    const validPaymentStatuses = ["Pending", "Paid", "Failed", "Refunded"];
    if (!validPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: `Payment status must be one of: ${validPaymentStatuses.join(
          ", "
        )}`,
      });
    }
  }

  next();
};

module.exports = {
  validateOrderId,
  checkOrderExists,
  verifyOrderOwnership,
  validateOrderInput,
  validateStatusUpdate,
};
