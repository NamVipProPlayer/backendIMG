const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const orderMiddlewares = require("../middlewares/orderMiddleware");
const {
  authMiddleware,
  adminMiddleware,
} = require("../middlewares/authMiddleware");

// Create a new order - requires authentication
router.post(
  "/",
  authMiddleware,
  orderMiddlewares.validateOrderInput,
  orderController.createOrder
);

// Get all orders - admin only
router.get("/", authMiddleware, adminMiddleware, orderController.getAllOrders);

// Get current user's orders
router.get("/myorders", authMiddleware, orderController.getUserOrders);

// Get order statistics - admin only
router.get(
  "/statistics",
  authMiddleware,
  adminMiddleware,
  orderController.getOrderStatistics
);

// Get orders by product ID - admin only
router.get(
  "/product/:productId",
  authMiddleware,
  adminMiddleware,
  orderController.getOrdersByProduct
);

// Get specific order by ID
router.get(
  "/:id",
  authMiddleware,
  orderMiddlewares.validateOrderId,
  orderMiddlewares.checkOrderExists,
  orderController.getOrderById
);

// Update order status - admin only
router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  orderMiddlewares.validateOrderId,
  orderMiddlewares.checkOrderExists,
  orderMiddlewares.validateStatusUpdate,
  orderController.updateOrderStatus
);

// Delete order - admin only
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  orderMiddlewares.validateOrderId,
  orderMiddlewares.checkOrderExists,
  orderController.deleteOrder
);

// Cancel an order
router.put(
  "/:id/cancel",
  authMiddleware,
  orderMiddlewares.validateOrderId,
  orderMiddlewares.checkOrderExists,
  orderController.cancelOrder
);

// Update shipping address
router.put(
  "/:id/shipping",
  authMiddleware,
  orderMiddlewares.validateOrderId,
  orderMiddlewares.checkOrderExists,
  orderMiddlewares.verifyOrderOwnership,
  orderController.updateShippingAddress
);

// Generate order receipt/invoice
router.get(
  "/:id/receipt",
  authMiddleware,
  orderMiddlewares.validateOrderId,
  orderMiddlewares.checkOrderExists,
  orderController.generateOrderReceipt
);

// Process refund - admin only
router.post(
  "/:id/refund",
  authMiddleware,
  adminMiddleware,
  orderMiddlewares.validateOrderId,
  orderMiddlewares.checkOrderExists,
  orderController.processRefundRequest
);

// Update order notes
router.put(
  "/:id/notes",
  authMiddleware,
  orderMiddlewares.validateOrderId,
  orderMiddlewares.checkOrderExists,
  orderMiddlewares.verifyOrderOwnership,
  orderController.updateOrderNotes
);

// Send order confirmation notification - admin only
router.post(
  "/:id/send-confirmation",
  authMiddleware,
  adminMiddleware,
  orderMiddlewares.validateOrderId,
  orderMiddlewares.checkOrderExists,
  orderController.sendOrderConfirmation
);

// Update entire order (comprehensive update) - admin only
router.put(
  "/:id/update",
  authMiddleware,
  adminMiddleware,
  orderMiddlewares.validateOrderId,
  orderMiddlewares.checkOrderExists,
  orderController.updateOrder
);
module.exports = router;
