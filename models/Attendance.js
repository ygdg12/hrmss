const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  date: { type: Date, required: true },                // the working day
  clockIn: { type: Date },                             // set on clock-in
  clockOut: { type: Date },                            // set on clock-out
  totalMinutes: { type: Number, default: 0 },          // computed on clock-out
  source: { type: String, enum: ["Manual", "Web", "Mobile"], default: "Web" },
  notes: { type: String }
}, { timestamps: true });

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true }); // one record per day

module.exports = mongoose.model("Attendance", attendanceSchema);
