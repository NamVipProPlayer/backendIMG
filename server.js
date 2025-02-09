const express = require("express");
const mongoose = require("mongoose");
require("dotenv/config");

const app = express();

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
  console.log("Server is running on port 8080");
});
