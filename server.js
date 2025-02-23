const crypto = require("crypto");
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const cors = require("cors");

const app = express();
const corsOptionsDelegate = function (req, callback) {
  const allowedOrigins = [
    "http://localhost:5173",
    "https://e-commerce-project-reactjs.vercel.app",
  ];
  let corsOptions;

  if (allowedOrigins.includes(req.header("Origin"))) {
    corsOptions = { origin: true, credentials: true }; // Allow the request
  } else {
    corsOptions = { origin: false }; // Block the request
  }
  callback(null, corsOptions);
};

app.use(cors(corsOptionsDelegate));

// Middleware for JSON parsing
app.use(express.json());
app.get("/cloudinary-signature", (req, res) => {
  const timestamp = Math.round(new Date().getTime() / 1000); // Generate current timestamp
  const secret = process.env.CLOUDINARY_API_SECRET; // Get secret key from .env

  if (!secret) {
    return res.status(500).json({ error: "Missing Cloudinary API secret" });
  }

  const signature = crypto
    .createHash("sha256")
    .update(`timestamp=${timestamp}${secret}`) // Hashing logic
    .digest("hex");

  res.json({ timestamp, signature });
});

//import auth
const authRoute = require("./routes/auth");
app.use("/api/auth", authRoute);

// Import Product Router
const productRoute = require("./routes/product");
app.use("/api/product", productRoute);

//Import Shoe Product Router
const shoesProduct = require("./routes/shoesRoute");
app.use("/api/shoesRoute", shoesProduct);

// Database connection
async function connectDB() {
  try {
    await mongoose.connect(process.env.DB_CONNECTION);
    console.log("Connected successfully to DB");
  } catch (error) {
    console.error("DB Connection Error:", error);
  }
}

connectDB();

// Start server
app.listen(process.env.PORT, () => {
  console.log("Server is running");
});
