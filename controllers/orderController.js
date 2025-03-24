const Order = require("../models/Order");
const ShoesProduct = require("../models/ShoesProduct.js"); // Assuming this is your product model

// Create new order
const createOrder = async (req, res) => {
  try {
    const {
      items,
      totalAmount,
      shipping = 0,
      couponCode = null,
      discount = 0,
      finalAmount,
      shippingAddress,
      paymentMethod,
      customerNotes,
      paymentStatus, // Add this field
      paymentDetails, // Add this field for VNPAY details
    } = req.body;

    // Create a new order with the current user
    const newOrder = new Order({
      user: req.user._id,
      items,
      totalAmount,
      shipping,
      couponCode,
      discount,
      finalAmount,
      shippingAddress,
      paymentMethod,
      customerNotes,
      paymentStatus, // Include payment status
      paymentDetails, // Include payment details
      statusHistory: [
        {
          status: "Processing",
          timestamp: Date.now(),
          note: `Order created with ${paymentMethod} payment (${paymentStatus})`,
        },
      ],
    });

    // Save the order
    await newOrder.save();

    // Update product stock for each ordered item
    for (const item of items) {
      const product = await ShoesProduct.findById(item.product);

      if (!product) {
        console.error(`Product not found: ${item.product}`);
        continue;
      }

      // Decrease the stock directly, ensuring it doesn't go below 0
      const newStock = Math.max(0, product.stock - item.quantity);
      product.stock = newStock;

      // Save the updated product
      await product.save();

      console.log(
        `Updated stock for product ${product.name}: new stock ${product.stock}`
      );
    }

    // Populate product details for the response
    const populatedOrder = await Order.findById(newOrder._id)
      .populate("user", "name email")
      .populate("items.product", "name images");

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: populatedOrder,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while creating the order",
      error: error.message,
    });
  }
};

// Get all orders (admin only)
const getAllOrders = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filter parameters
    const filters = { isDeleted: false };

    if (req.query.orderStatus) {
      filters.orderStatus = req.query.orderStatus;
    }

    if (req.query.paymentStatus) {
      filters.paymentStatus = req.query.paymentStatus;
    }

    if (req.query.paymentMethod) {
      filters.paymentMethod = req.query.paymentMethod;
    }

    // Date range filter
    if (req.query.startDate && req.query.endDate) {
      filters.orderedAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate),
      };
    }

    // Get orders with pagination
    const orders = await Order.find(filters)
      .populate("user", "name email")
      .populate("items.product", "name images")
      .sort({ orderedAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalOrders = await Order.countDocuments(filters);

    res.status(200).json({
      success: true,
      count: orders.length,
      total: totalOrders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page,
      orders,
    });
  } catch (error) {
    console.error("Error getting all orders:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while retrieving orders",
      error: error.message,
    });
  }
};

// Get user's orders
const getUserOrders = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const userId = req.user._id; // Assuming req.user is available from auth middleware

    // Filter parameters
    const filters = {
      user: userId,
      isDeleted: false,
    };

    if (req.query.orderStatus) {
      filters.orderStatus = req.query.orderStatus;
    }

    // Get user's orders with pagination
    const orders = await Order.find(filters)
      .populate("items.product", "name images")
      .sort({ orderedAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalOrders = await Order.countDocuments(filters);

    res.status(200).json({
      success: true,
      count: orders.length,
      total: totalOrders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page,
      orders,
    });
  } catch (error) {
    console.error("Error getting user orders:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while retrieving your orders",
      error: error.message,
    });
  }
};

// Get single order by ID
const getOrderById = async (req, res) => {
  try {
    // Order is already attached to req.order by the checkOrderExists middleware
    const order = await Order.findById(req.order._id)
      .populate("user", "name email")
      .populate("items.product", "name images");

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Error getting order by ID:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while retrieving the order",
      error: error.message,
    });
  }
};

// Update order status (admin only)
const updateOrderStatus = async (req, res) => {
  try {
    const { orderStatus, paymentStatus, note } = req.body;
    const order = req.order;

    // Update order status if provided
    if (orderStatus && order.orderStatus !== orderStatus) {
      order.orderStatus = orderStatus;
      order.statusHistory.push({
        status: orderStatus,
        timestamp: Date.now(),
        note: note || `Order status updated to ${orderStatus}`,
      });
    }

    // Update payment status if provided
    if (paymentStatus && order.paymentStatus !== paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    // Update tracking information if provided
    if (req.body.tracking) {
      order.tracking = {
        ...order.tracking,
        ...req.body.tracking,
      };
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order: await Order.findById(order._id)
        .populate("user", "name email")
        .populate("items.product", "name images"),
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while updating the order status",
      error: error.message,
    });
  }
};

// Cancel order (customer or admin)
const cancelOrder = async (req, res) => {
  try {
    const order = req.order;

    // Can only cancel if order is in Processing state
    if (order.orderStatus !== "Processing") {
      return res.status(400).json({
        success: false,
        message: "Order cannot be cancelled at this stage",
      });
    }

    // Update order status to Cancelled
    order.orderStatus = "Cancelled";
    order.statusHistory.push({
      status: "Cancelled",
      timestamp: Date.now(),
      note: req.body.cancellationReason || "Order cancelled by user",
    });

    // Restore product stocks for cancelled order
    for (const item of order.items) {
      const product = await ShoesProduct.findById(item.product);

      if (!product) {
        console.error(`Product not found: ${item.product}`);
        continue;
      }

      // Restore the stock directly
      product.stock += item.quantity;

      // Save the updated product
      await product.save();

      console.log(
        `Restored stock for product ${product.name}: new stock ${product.stock}`
      );
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while cancelling the order",
      error: error.message,
    });
  }
};

// Soft delete order (admin only)
const deleteOrder = async (req, res) => {
  try {
    const order = req.order;

    // Soft delete by setting isDeleted to true
    order.isDeleted = true;

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while deleting the order",
      error: error.message,
    });
  }
};

// Get order statistics (admin only)
const getOrderStatistics = async (req, res) => {
  try {
    // Get time range from query params or default to last 30 days
    const endDate = new Date();
    const startDate = req.query.startDate
      ? new Date(req.query.startDate)
      : new Date(endDate - 30 * 24 * 60 * 60 * 1000);

    // Count orders by status
    const statusCounts = await Order.aggregate([
      {
        $match: {
          orderedAt: { $gte: startDate, $lte: endDate },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    // Calculate total revenue in date range
    const revenueData = await Order.aggregate([
      {
        $match: {
          orderedAt: { $gte: startDate, $lte: endDate },
          paymentStatus: "Paid",
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$finalAmount" },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: "$finalAmount" },
        },
      },
    ]);

    // Get revenue per day for chart
    const dailyRevenue = await Order.aggregate([
      {
        $match: {
          orderedAt: { $gte: startDate, $lte: endDate },
          paymentStatus: "Paid",
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$orderedAt" },
          },
          revenue: { $sum: "$finalAmount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get top selling products
    const topProducts = await Order.aggregate([
      {
        $match: {
          orderedAt: { $gte: startDate, $lte: endDate },
          isDeleted: false,
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: {
            $sum: { $multiply: ["$items.price", "$items.quantity"] },
          },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "shoesproducts", // collection name in MongoDB
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $project: {
          _id: 1,
          totalQuantity: 1,
          totalRevenue: 1,
          productName: { $arrayElemAt: ["$productDetails.name", 0] },
          productImage: { $arrayElemAt: ["$productDetails.images", 0] },
        },
      },
    ]);

    // Payment method distribution
    const paymentMethodStats = await Order.aggregate([
      {
        $match: {
          orderedAt: { $gte: startDate, $lte: endDate },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          revenue: { $sum: "$finalAmount" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      timeRange: {
        startDate,
        endDate,
      },
      orderStats: {
        statusCounts: statusCounts.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        totalOrders: statusCounts.reduce((sum, item) => sum + item.count, 0),
      },
      revenueStats:
        revenueData.length > 0
          ? {
              totalRevenue: revenueData[0].totalRevenue,
              orderCount: revenueData[0].orderCount,
              averageOrderValue: revenueData[0].averageOrderValue,
            }
          : {
              totalRevenue: 0,
              orderCount: 0,
              averageOrderValue: 0,
            },
      dailyRevenue,
      topProducts,
      paymentMethodStats,
    });
  } catch (error) {
    console.error("Error getting order statistics:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while retrieving order statistics",
      error: error.message,
    });
  }
};

// Update shipping address
const updateShippingAddress = async (req, res) => {
  try {
    const order = req.order;
    const { shippingAddress } = req.body;

    // Can only update if order is still in Processing state
    if (order.orderStatus !== "Processing") {
      return res.status(400).json({
        success: false,
        message: "Shipping address cannot be updated at this stage",
      });
    }

    // Validate required shipping address fields
    if (
      !shippingAddress ||
      !shippingAddress.street ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.country ||
      !shippingAddress.phoneNumber
    ) {
      return res.status(400).json({
        success: false,
        message: "Complete shipping address is required",
      });
    }

    // Update the shipping address
    order.shippingAddress = shippingAddress;
    order.statusHistory.push({
      status: order.orderStatus,
      timestamp: Date.now(),
      note: "",
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: "Shipping address updated successfully",
      order,
    });
  } catch (error) {
    console.error("Error updating shipping address:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while updating the shipping address",
      error: error.message,
    });
  }
};

// Create order receipt/invoice
const generateOrderReceipt = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId)
      .populate("user", "name email")
      .populate("items.product", "name images");

    // Continue from the generateOrderReceipt function
    if (!order || order.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Format the receipt data
    const receiptData = {
      orderId: order._id,
      orderDate: new Date(order.orderedAt).toLocaleDateString(),
      customerInfo: {
        name: order.user.name,
        email: order.user.email,
        shippingAddress: order.shippingAddress,
      },
      items: order.items.map((item) => ({
        productName: item.product.name,
        size: item.size,
        quantity: item.quantity,
        unitPrice: item.price,
        subtotal: item.price * item.quantity,
      })),
      paymentInfo: {
        method: order.paymentMethod,
        status: order.paymentStatus,
      },
      pricing: {
        subtotal: order.totalAmount,
        shipping: order.shipping,
        discount: order.discount,
        total: order.finalAmount,
      },
      orderStatus: order.orderStatus,
      receiptGenerated: new Date().toISOString(),
    };

    // Normally here you would generate a PDF or formatted receipt
    // For this implementation, we'll just return the formatted data
    res.status(200).json({
      success: true,
      receiptData,
    });
  } catch (error) {
    console.error("Error generating order receipt:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while generating the receipt",
      error: error.message,
    });
  }
};

// Process refund request
const processRefundRequest = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { reason, refundMethod } = req.body;

    const order = await Order.findById(orderId);

    if (!order || order.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Validate refund eligibility
    if (
      order.orderStatus === "Cancelled" &&
      order.paymentStatus === "Refunded"
    ) {
      return res.status(400).json({
        success: false,
        message: "This order has already been refunded",
      });
    }

    if (!["Delivered", "Cancelled"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Only delivered or cancelled orders can be refunded",
      });
    }

    if (
      order.paymentMethod === "Cash on Delivery" &&
      order.paymentStatus !== "Paid"
    ) {
      return res.status(400).json({
        success: false,
        message: "Cash on delivery orders that weren't paid cannot be refunded",
      });
    }

    // In a real application, you would process the refund through payment gateway here
    // For now, we'll just update the order status

    order.paymentStatus = "Refunded";
    order.statusHistory.push({
      status: "Refund Processed",
      timestamp: Date.now(),
      note: `Refund processed. Reason: ${reason || "Not specified"}`,
    });

    // Save the refund details
    const refundDetails = {
      refundDate: new Date(),
      refundAmount: order.finalAmount,
      refundMethod: refundMethod || order.paymentMethod,
      reason: reason || "Customer request",
      processedBy: req.user._id, // Assuming req.user is available
    };

    // We would typically save this to a refunds collection
    // But for now, let's just add it to the order document
    order.refundDetails = refundDetails;

    await order.save();

    res.status(200).json({
      success: true,
      message: "Refund processed successfully",
      order,
    });
  } catch (error) {
    console.error("Error processing refund request:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while processing the refund",
      error: error.message,
    });
  }
};

// Get orders by product ID
const getOrdersByProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Find all orders containing the specified product
    const orders = await Order.find({
      "items.product": productId,
      isDeleted: false,
    })
      .populate("user", "name email")
      .populate("items.product", "name images")
      .sort({ orderedAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalOrders = await Order.countDocuments({
      "items.product": productId,
      isDeleted: false,
    });

    // Extract relevant product data from the orders
    const productOrderData = orders.map((order) => {
      const productItem = order.items.find(
        (item) => item.product._id.toString() === productId
      );

      return {
        orderId: order._id,
        orderDate: order.orderedAt,
        customer: {
          name: order.user.name,
          email: order.user.email,
        },
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        productData: {
          quantity: productItem.quantity,
          size: productItem.size,
          price: productItem.price,
        },
      };
    });

    res.status(200).json({
      success: true,
      count: productOrderData.length,
      total: totalOrders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page,
      productOrderData,
    });
  } catch (error) {
    console.error("Error getting orders by product:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while retrieving orders for this product",
      error: error.message,
    });
  }
};

// Log system audit for order changes
const logOrderAudit = async (orderId, userId, action, details) => {
  try {
    // In a real implementation, this would save to an AuditLog collection
    console.log(
      `AUDIT: Order ${orderId} - Action: ${action} - By User: ${userId} - ${new Date().toISOString()}`
    );
    console.log(`Details: ${JSON.stringify(details)}`);

    // Return success silently - logging should not affect the main operation
    return true;
  } catch (error) {
    console.error("Error logging audit:", error);
    return false; // Failed but don't crash the main operation
  }
};

// Update customer notes on an order
const updateOrderNotes = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { customerNotes } = req.body;

    const order = await Order.findById(orderId);

    if (!order || order.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Update the customer notes
    order.customerNotes = customerNotes;

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order notes updated successfully",
      order,
    });
  } catch (error) {
    console.error("Error updating order notes:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while updating the order notes",
      error: error.message,
    });
  }
};

// Send order confirmation notification
const sendOrderConfirmation = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId)
      .populate("user", "name email")
      .populate("items.product", "name images");

    if (!order || order.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // In a real implementation, you would send an email or notification here
    // For now, we'll just log it and return a success message

    console.log(
      `Notification sent for order ${orderId} to ${order.user.email}`
    );

    // Add to status history
    order.statusHistory.push({
      status: order.orderStatus,
      timestamp: Date.now(),
      note: "Order confirmation notification sent",
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order confirmation notification sent successfully",
      sentTo: order.user.email,
    });
  } catch (error) {
    console.error("Error sending order confirmation:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while sending the confirmation",
      error: error.message,
    });
  }
};

// Update order (admin only) - comprehensive update
const updateOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId);

    if (!order || order.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Extract update data from request body
    const {
      orderStatus,
      paymentStatus,
      tracking,
      shippingAddress,
      customerNotes,
      items,
      totalAmount,
      shipping,
      discount,
      finalAmount,
      paymentMethod,
      note,
    } = req.body;

    // Track what changed for status history and audit
    const changes = [];

    // Update order status if provided
    if (orderStatus && order.orderStatus !== orderStatus) {
      changes.push(
        `Order status changed from ${order.orderStatus} to ${orderStatus}`
      );
      order.orderStatus = orderStatus;
    }

    // Update payment status if provided
    if (paymentStatus && order.paymentStatus !== paymentStatus) {
      changes.push(
        `Payment status changed from ${order.paymentStatus} to ${paymentStatus}`
      );
      order.paymentStatus = paymentStatus;
    }

    // Update tracking information if provided
    if (tracking) {
      const trackingChanges = [];

      if (tracking.carrier && tracking.carrier !== order.tracking?.carrier) {
        trackingChanges.push(`Carrier updated to ${tracking.carrier}`);
      }

      if (
        tracking.trackingNumber &&
        tracking.trackingNumber !== order.tracking?.trackingNumber
      ) {
        trackingChanges.push(
          `Tracking number updated to ${tracking.trackingNumber}`
        );
      }

      if (
        tracking.estimatedDeliveryDate &&
        (!order.tracking?.estimatedDeliveryDate ||
          new Date(tracking.estimatedDeliveryDate).toString() !==
            new Date(order.tracking.estimatedDeliveryDate).toString())
      ) {
        const formattedDate = new Date(tracking.estimatedDeliveryDate)
          .toISOString()
          .split("T")[0];
        trackingChanges.push(`Estimated delivery date set to ${formattedDate}`);
      }

      if (trackingChanges.length > 0) {
        changes.push(` ${trackingChanges.join(", ")}`);
        order.tracking = {
          ...order.tracking,
          ...tracking,
        };
      }
    }

    // Update shipping address if provided
    if (shippingAddress && Object.keys(shippingAddress).length > 0) {
      // Validate required shipping address fields
      const requiredFields = [
        "houseNumber",
        "street",
        "ward",
        "district",
        "cityOrProvince",
        "phoneNumber",
      ];
      const missingFields = requiredFields.filter(
        (field) => !shippingAddress[field]
      );

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing required shipping address fields: ${missingFields.join(
            ", "
          )}`,
        });
      }

      changes.push("Shipping address updated");
      order.shippingAddress = shippingAddress;
    }

    // Update customer notes if provided
    if (customerNotes !== undefined && customerNotes !== order.customerNotes) {
      changes.push("Customer notes updated");
      order.customerNotes = customerNotes;
    }

    // Update payment method if provided
    if (paymentMethod && paymentMethod !== order.paymentMethod) {
      changes.push(
        `Payment method changed from ${order.paymentMethod} to ${paymentMethod}`
      );
      order.paymentMethod = paymentMethod;
    }

    // Update order items if provided
    // Note: This is complex and might require additional validation in a production environment
    if (items && items.length > 0) {
      // Verify each item has required fields and product exists
      for (const item of items) {
        if (!item.product || !item.size || !item.quantity || !item.price) {
          return res.status(400).json({
            success: false,
            message:
              "Each order item must have product, size, quantity, and price",
          });
        }

        // Optionally verify the product exists
        const productExists = await ShoesProduct.exists({ _id: item.product });
        if (!productExists) {
          return res.status(400).json({
            success: false,
            message: `Product with ID ${item.product} does not exist`,
          });
        }
      }

      changes.push("Order updated");
      order.items = items;
    }

    // Update amount fields if provided
    let recalculateFinal = false;

    if (totalAmount !== undefined && totalAmount !== order.totalAmount) {
      changes.push(
        `Total amount updated from ${order.totalAmount} to ${totalAmount}`
      );
      order.totalAmount = totalAmount;
      recalculateFinal = true;
    }

    if (shipping !== undefined && shipping !== order.shipping) {
      changes.push(
        `Shipping cost updated from ${order.shipping} to ${shipping}`
      );
      order.shipping = shipping;
      recalculateFinal = true;
    }

    if (discount !== undefined && discount !== order.discount) {
      changes.push(`Discount updated from ${order.discount} to ${discount}`);
      order.discount = discount;
      recalculateFinal = true;
    }

    // Recalculate finalAmount if component values changed
    if (recalculateFinal) {
      const newFinalAmount =
        order.totalAmount + order.shipping - order.discount;
      changes.push(
        `Final amount recalculated from ${order.finalAmount} to ${newFinalAmount}`
      );
      order.finalAmount = newFinalAmount;
    }
    // Or update finalAmount directly if provided
    else if (finalAmount !== undefined && finalAmount !== order.finalAmount) {
      changes.push(
        `Final amount updated from ${order.finalAmount} to ${finalAmount}`
      );
      order.finalAmount = finalAmount;
    }

    // If changes were made, update history and updatedAt
    if (changes.length > 0) {
      // Add entry to status history
      const changeNotes = note || changes.join("; ");
      const statusToRecord = orderStatus || order.orderStatus;

      order.statusHistory.push({
        status: statusToRecord,
        timestamp: Date.now(),
        note: changeNotes,
      });

      // Update the updatedAt timestamp
      order.updatedAt = Date.now();

      // Record who made the changes (assuming req.user is available from auth middleware)
      const adminUser = req.user
        ? req.user.name || req.user._id
        : "NamProPlayer20";
      const currentDate = "2025-03-21 05:55:05"; // Using provided timestamp

      // Log for audit purposes
      logOrderAudit(orderId, adminUser, "UPDATE", {
        changes,
        timestamp: currentDate,
      });

      // Save the updated order
      await order.save();

      // Return the updated order with populated fields
      const updatedOrder = await Order.findById(orderId)
        .populate("user", "name email")
        .populate("items.product", "name images");

      return res.status(200).json({
        success: true,
        message: "Order updated successfully",
        changes,
        order: updatedOrder,
      });
    } else {
      // No changes were made
      return res.status(200).json({
        success: true,
        message: "No changes made to order",
        order,
      });
    }
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while updating the order",
      error: error.message,
    });
  }
};
// Export all controllers
module.exports = {
  createOrder,
  getAllOrders,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  deleteOrder,
  getOrderStatistics,
  updateShippingAddress,
  generateOrderReceipt,
  processRefundRequest,
  getOrdersByProduct,
  updateOrderNotes,
  sendOrderConfirmation,
  updateOrder,
};
