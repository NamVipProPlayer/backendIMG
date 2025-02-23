const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const AuthSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true }, // Ensure email is unique
    password: { type: String, required: true },
    roleId: { type: Number,default: 1, required: true },
    phone: { type: String }, // Changed to String to store full numbers correctly
  },
  { timestamps: true }
);


// Hash password before saving
AuthSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare hashed password
AuthSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};


module.exports = mongoose.model("Authenticate", AuthSchema);
