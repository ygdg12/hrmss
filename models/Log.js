const mongoose = require("mongoose");

const logSchema = new mongoose.Schema(
  {
    action: { 
      type: String, 
      required: true,
      enum: [
        // Employee actions
        "Employee Added", "Employee Updated", "Employee Deleted", "Profile Updated",
        // Leave actions
        "Leave Requested", "Leave Approved", "Leave Rejected", "Leave Cancelled",
        // Approval actions
        "Approval Granted", "Approval Denied", "Approval Pending",
        // System actions
        "Login", "Logout", "Password Changed", "Role Changed",
        // Report actions
        "Report Generated", "Data Exported"
      ]
    },
    user: { 
      type: String, 
      required: true 
    },
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    target: { 
      type: String 
    },
    targetId: { 
      type: mongoose.Schema.Types.ObjectId 
    },
    details: { 
      type: Object 
    },
    ipAddress: { 
      type: String 
    },
    userAgent: { 
      type: String 
    },
    category: {
      type: String,
      enum: ["Employee", "Leave", "Approval", "System", "Report"],
      required: true
    },
    severity: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Low"
    },
    timestamp: { 
      type: Date, 
      default: Date.now 
    }
  },
  { timestamps: true }
);

// Index for better query performance
logSchema.index({ action: 1, timestamp: -1 });
logSchema.index({ category: 1, timestamp: -1 });
logSchema.index({ user: 1, timestamp: -1 });

module.exports = mongoose.model("Log", logSchema);
