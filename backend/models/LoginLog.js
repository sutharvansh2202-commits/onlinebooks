const mongoose = require("mongoose");

const loginLogSchema = new mongoose.Schema({
  email: { type: String, required: true },
  success: { type: Boolean, required: true },
  timestamp: { type: Date, default: Date.now },
  ip: { type: String },
});

module.exports = mongoose.model("LoginLog", loginLogSchema);
