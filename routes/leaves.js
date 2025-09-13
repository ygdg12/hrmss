const express = require("express");
const router = express.Router();
const Leave = require("../models/Leave");
const Employee = require("../models/Employee");
const auth = require("../middleware/authMiddleware");
const checkRole = require("../middleware/checkRole");
const { dayDiffInclusive } = require("../utils/dates");
const { logEmployeeAction } = require("../middleware/logger");

// Request leave (Employee or HR/Admin on behalf)
router.post("/request", auth, async (req, res) => {
  try {
    const { employeeId, type, startDate, endDate, reason } = req.body;

    // If user is an employee, they can only request for themselves
    const targetEmployeeId = req.user.role === "Staff" ? req.user.employeeId : (employeeId || req.user.employeeId);

    const employee = await Employee.findById(targetEmployeeId);
    if (!employee) return res.status(404).json({ error: "Employee not found" });

    const days = dayDiffInclusive(startDate, endDate);
    if (days <= 0) return res.status(400).json({ error: "Invalid date range" });

    // Optional pre-check of balance for paid types
    const key = type.toLowerCase(); // "annual", "sick", etc.
    if (employee.leaveBalance[key] !== undefined && employee.leaveBalance[key] < days) {
      return res.status(400).json({ error: `Insufficient ${type} leave balance` });
    }

    const leave = await Leave.create({
      employee: employee._id,
      type, startDate, endDate, days, reason
    });

    await logEmployeeAction("Leave Requested", employee, req.user.email, req);
    res.status(201).json(leave);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Approve leave (HR/Admin)
async function approveLeaveHandler(req, res) {
  try {
    console.log("Approve leave request:", req.params.id);
    console.log("User:", req.user);
    
    const leave = await Leave.findById(req.params.id).populate("employee");
    if (!leave) return res.status(404).json({ error: "Leave not found" });
    if (leave.status !== "Pending") return res.status(400).json({ error: "Leave is not pending" });

    const employee = leave.employee;
    const key = leave.type.toLowerCase();
    
    console.log("Employee:", employee);
    console.log("Leave type:", leave.type);
    console.log("Key:", key);
    console.log("Employee leaveBalance:", employee.leaveBalance);

    // Deduct balance if tracked (only if employee has leaveBalance and the key exists)
    if (employee.leaveBalance && employee.leaveBalance[key] !== undefined) {
      console.log(`Current ${key} balance:`, employee.leaveBalance[key]);
      console.log("Requested days:", leave.days);
      
      if (employee.leaveBalance[key] < leave.days) {
        return res.status(400).json({ error: `Insufficient ${leave.type} balance` });
      }
      employee.leaveBalance[key] -= leave.days;
      employee.lastLeaveRequest = new Date();
      await employee.save();
      console.log(`Updated ${key} balance:`, employee.leaveBalance[key]);
    } else {
      console.log("No leave balance tracking for this leave type");
    }

    leave.status = "Approved";
    leave.decidedBy = req.user.id;
    leave.decidedAt = new Date();
    await leave.save();

    console.log("Leave saved successfully");
    
    // Try to log the action, but don't fail if logging fails
    try {
      await logEmployeeAction("Leave Approved", employee, req.user.email, req);
      console.log("Action logged successfully");
    } catch (logError) {
      console.error("Logging error (non-fatal):", logError.message);
    }
    
    res.json(leave);
  } catch (e) {
    console.error("Error in approveLeaveHandler:", e);
    res.status(500).json({ error: e.message });
  }
}
router.post("/:id/approve", auth, checkRole(["Admin", "HR"]), approveLeaveHandler);
router.put("/:id/approve", auth, checkRole(["Admin", "HR"]), approveLeaveHandler);

// Reject leave (HR/Admin)
async function rejectLeaveHandler(req, res) {
  try {
    console.log("Reject leave request:", req.params.id);
    console.log("User:", req.user);
    
    // Check if user object exists and has required properties
    if (!req.user || !req.user.id) {
      console.error("User object missing or invalid:", req.user);
      return res.status(401).json({ error: "User authentication invalid" });
    }
    
    const leave = await Leave.findById(req.params.id).populate("employee");
    if (!leave) return res.status(404).json({ error: "Leave not found" });
    if (leave.status !== "Pending") return res.status(400).json({ error: "Leave is not pending" });

    leave.status = "Rejected";
    leave.decidedBy = req.user.id;
    leave.decidedAt = new Date();
    await leave.save();

    console.log("Leave saved successfully");
    
    // Try to log the action, but don't fail if logging fails
    try {
      await logEmployeeAction("Leave Rejected", leave.employee, req.user.email, req);
      console.log("Action logged successfully");
    } catch (logError) {
      console.error("Logging error (non-fatal):", logError.message);
    }
    
    res.json(leave);
  } catch (e) {
    console.error("Error in rejectLeaveHandler:", e);
    res.status(500).json({ error: e.message });
  }
}
router.post("/:id/reject", auth, checkRole(["Admin", "HR"]), rejectLeaveHandler);
router.put("/:id/reject", auth, checkRole(["Admin", "HR"]), rejectLeaveHandler);

// Cancel (Employee can cancel their own pending request)
async function cancelLeaveHandler(req, res) {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ error: "Leave not found" });
    if (String(leave.employee) !== String(req.user.employeeId) && !["Admin","HR"].includes(req.user.role)) {
      return res.status(403).json({ error: "Not allowed" });
    }
    if (leave.status !== "Pending") return res.status(400).json({ error: "Only pending leaves can be cancelled" });

    leave.status = "Cancelled";
    leave.decidedBy = req.user.id;
    leave.decidedAt = new Date();
    await leave.save();

    res.json(leave);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
router.post("/:id/cancel", auth, cancelLeaveHandler);
router.put("/:id/cancel", auth, cancelLeaveHandler);

// Get my leaves (Employee)
router.get("/my", auth, async (req, res) => {
  try {
    const leaves = await Leave.find({ employee: req.user.employeeId }).sort({ createdAt: -1 });
    res.json(leaves);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin/HR: list leaves with filters
router.get("/", auth, checkRole(["Admin", "HR"]), async (req, res) => {
  try {
    const { status, type, employee } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (employee) filter.employee = employee;

    const leaves = await Leave.find(filter).populate("employee", "firstName lastName email department").sort({ createdAt: -1 });
    res.json(leaves);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
