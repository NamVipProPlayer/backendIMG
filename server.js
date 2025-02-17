const express = require("express");
const mongoose = require("mongoose");
require("dotenv/config");
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

// Import Product Router
const productRoute = require("./routes/product");
app.use("/product", productRoute);

// Home Route
app.get("/", (req, res) => {
  res.send("Hello world");
});

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
