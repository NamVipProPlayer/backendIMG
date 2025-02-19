const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const AuthSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String },
    password: { type: String, require: true },
    roleId: { type: Number, require: true },
    phone: { type: Number },
  },
  { timestamps: true }
);
// Hash password before saving
AuthSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare hashed password
AuthSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("Authenticate", AuthSchema);
