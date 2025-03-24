const mongoose = require("mongoose");
const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Authenticate",
      required: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "ShoesProduct",
          required: true,
        },
        size: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    shipping: {
      type: Number,
      default: 0,
    },
    couponCode: {
      type: String,
      default: null,
    },
    discount: {
      type: Number,
      default: 0,
    },
    finalAmount: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },
    orderStatus: {
      type: String,
      enum: ["Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Processing",
    },
    statusHistory: [
      {
        status: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        note: String,
      },
    ],
    shippingAddress: {
      houseNumber: { type: String, required: true }, 
      street: { type: String, required: true }, 
      ward: { type: String, required: true }, 
      district: { type: String, required: true }, 
      cityOrProvince: { type: String, required: true }, 
      phoneNumber: { type: String, required: true },
    },
    tracking: {
      carrier: String,
      trackingNumber: String,
      estimatedDeliveryDate: Date,
    },
    paymentMethod: {
      type: String,
      enum: ["Credit Card", "PayPal", "Cash on Delivery", "VNPay"],
      required: true,
    },
    customerNotes: String,
    orderedAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: "orderedAt", updatedAt: "updatedAt" },
  }
);

// Pre-save hook to update the updatedAt timestamp
orderSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});
module.exports = mongoose.model("Order", orderSchema);
