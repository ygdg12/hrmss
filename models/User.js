const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["Admin", "HR", "Staff"], // Allowed roles
      default: "Staff",
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: false // Not required for admin users
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
