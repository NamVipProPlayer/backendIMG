require("dotenv").config();
const crypto = require("crypto");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Generate signature for Cloudinary uploads
app.get("/api/cloudinary-signature", (req, res) => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = crypto
    .createHash("sha256")
    .update(`timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`)
    .digest("hex");

  res.json({ timestamp, signature });
});
