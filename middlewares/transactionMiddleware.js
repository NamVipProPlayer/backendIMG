const Transaction = require("../models/Transaction");
const Order = require("../models/Order"); // Assuming you have an Order model

// Helper function to generate unique transaction ID
const generateTransactionId = () => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TXN-${timestamp}-${random}`;
};

const transactionMiddleware = {
  // Create a new transaction
  createTransaction: async (req, res, next) => {
    try {
      const { orderId, paymentMethod, amount } = req.body;
      const userId = req.user.id;

      // Validate required fields
      if (!orderId || !paymentMethod || !amount) {
        return res.status(400).json({
          message: "Order ID, payment method, and amount are required",
        });
      }

      // Validate payment method
      const validPaymentMethods = ["Credit Card", "PayPal", "Cash on Delivery"];
      if (!validPaymentMethods.includes(paymentMethod)) {
        return res.status(400).json({
          message: "Invalid payment method",
          validMethods: validPaymentMethods,
        });
      }

      // Check if order exists
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Verify order belongs to user
      if (order.user.toString() !== userId) {
        return res.status(403).json({
          message:
            "You are not authorized to create a transaction for this order",
        });
      }

      // Create new transaction
      const transaction = new Transaction({
        user: userId,
        order: orderId,
        paymentMethod,
        amount,
        transactionId: generateTransactionId(),
        status: "Pending",
        createdAt: new Date(),
      });

      await transaction.save();

      const populatedTransaction = await Transaction.findById(transaction._id)
        .populate("user", "name email phone")
        .populate("order");

      res.status(201).json(populatedTransaction);
    } catch (error) {
      console.error("Create Transaction Error:", error);
      next(error);
    }
  },

  // Get all transactions for the authenticated user
  getUserTransactions: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const transactions = await Transaction.find({ user: userId })
        .populate("user", "name email phone")
        .populate("order")
        .sort({ createdAt: -1 }); // Most recent first

      res.status(200).json(transactions);
    } catch (error) {
      console.error("Get User Transactions Error:", error);
      next(error);
    }
  },

  // Get specific transaction by ID
  getTransactionById: async (req, res, next) => {
    try {
      const { transactionId } = req.params;
      const userId = req.user.id;

      const transaction = await Transaction.findById(transactionId)
        .populate("user", "name email phone")
        .populate("order");

      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      // Verify transaction belongs to user
      if (transaction.user._id.toString() !== userId) {
        return res.status(403).json({
          message: "You are not authorized to view this transaction",
        });
      }

      res.status(200).json(transaction);
    } catch (error) {
      console.error("Get Transaction Error:", error);
      next(error);
    }
  },

  // Update transaction status (Admin only)
  updateTransactionStatus: async (req, res, next) => {
    try {
      // Check if user is admin (roleId === 2)
      if (req.user.roleId !== 2) {
        return res.status(403).json({
          message: "Only administrators can update transaction status",
        });
      }

      const { transactionId } = req.params;
      const { status } = req.body;

      // Validate status
      const validStatuses = ["Pending", "Completed", "Failed", "Refunded"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid status",
          validStatuses,
        });
      }

      const transaction = await Transaction.findById(transactionId);

      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      transaction.status = status;
      await transaction.save();

      const updatedTransaction = await Transaction.findById(transactionId)
        .populate("user", "name email phone")
        .populate("order");

      res.status(200).json(updatedTransaction);
    } catch (error) {
      console.error("Update Transaction Status Error:", error);
      next(error);
    }
  },

  // Get transaction by transaction ID (string)
  getTransactionByTransactionId: async (req, res, next) => {
    try {
      const { transactionId } = req.params;
      const userId = req.user.id;

      const transaction = await Transaction.findOne({ transactionId })
        .populate("user", "name email phone")
        .populate("order");

      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      // Verify transaction belongs to user or user is admin
      if (transaction.user._id.toString() !== userId && req.user.roleId !== 2) {
        return res.status(403).json({
          message: "You are not authorized to view this transaction",
        });
      }

      res.status(200).json(transaction);
    } catch (error) {
      console.error("Get Transaction By TransactionId Error:", error);
      next(error);
    }
  },

  // Admin: Get all transactions
  getAllTransactions: async (req, res, next) => {
    try {
      // Check if user is admin
      if (req.user.roleId !== 2) {
        return res.status(403).json({
          message: "Only administrators can view all transactions",
        });
      }

      const { status, startDate, endDate } = req.query;
      let query = {};

      // Apply filters if provided
      if (status) {
        query.status = status;
      }

      if (startDate && endDate) {
        query.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      const transactions = await Transaction.find(query)
        .populate("user", "name email phone")
        .populate("order")
        .sort({ createdAt: -1 });

      res.status(200).json(transactions);
    } catch (error) {
      console.error("Get All Transactions Error:", error);
      next(error);
    }
  },
};

module.exports = transactionMiddleware;
