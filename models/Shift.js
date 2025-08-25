const mongoose = require("mongoose");

const shiftSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  name: { type: String, default: "Default" },
  startTime: { type: String, required: true }, // "09:00"
  endTime: { type: String, required: true },   // "17:00"
  daysOfWeek: { type: [Number], default: [1,2,3,4,5] }, // 0=Sun ... 6=Sat
  effectiveFrom: { type: Date, default: Date.now },
  effectiveTo: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model("Shift", shiftSchema);
