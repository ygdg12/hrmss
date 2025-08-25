// models/Employee.js
const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  department: { type: String, required: true },
  jobRole: { type: String, required: true },
  status: { type: String, enum: ["Active", "Inactive", "On Leave", "Terminated"], default: "Active" },
  dateOfJoining: { type: Date, default: Date.now },
  employeeId: { type: String, unique: true, default: () => `EMP-${Date.now()}` }, // 👈 auto generate

leaveBalance: {
  annual: { type: Number, default: 20 },   // 20 days default
  sick: { type: Number, default: 10 },
  personal: { type: Number, default: 5 },
  maternity: { type: Number, default: 90 },
  paternity: { type: Number, default: 10 }
},

  // Contract details
  contractType: { type: String, enum: ["Full-time", "Part-time", "Contract", "Internship"], default: "Full-time" },
  contractEndDate: { type: Date },

  // Uploaded documents
  documents: [
    {
      type: { type: String, enum: ["ID", "Certificate", "Contract", "Other"], required: true },
      filePath: { type: String, required: true }, // stored filename / URL
      uploadedAt: { type: Date, default: Date.now }
    }
  ],

  // Audit fields
  lastProfileUpdate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model("Employee", employeeSchema);
