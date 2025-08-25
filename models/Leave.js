const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  type: { type: String, enum: ["Annual", "Sick", "Personal", "Maternity", "Paternity", "Unpaid"], required: true },
  startDate: { type: Date, required: true },
  endDate:   { type: Date, required: true },
  days: { type: Number, required: true }, // precomputed total days (incl. weekends if you choose)
  reason: { type: String },
  status: { type: String, enum: ["Pending", "Approved", "Rejected", "Cancelled"], default: "Pending" },
  decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // HR/Admin who approved/rejected
  decidedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model("Leave", leaveSchema);
