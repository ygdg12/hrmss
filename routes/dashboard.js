const express = require("express");
const router = express.Router();
const Employee = require("../models/Employee");
const Leave = require("../models/Leave");
const Log = require("../models/Log");
const authMiddleware = require("../middleware/authMiddleware");
const checkRole = require("../middleware/checkRole");

// ✅ Dashboard Overview (Admin, HR)
router.get("/overview", authMiddleware, checkRole(["Admin", "HR"]), async (req, res) => {
  try {
    // Employee statistics
    const totalEmployees = await Employee.countDocuments();
    const activeEmployees = await Employee.countDocuments({ status: "Active" });
    const onLeaveEmployees = await Employee.countDocuments({ status: "On Leave" });
    
    // Leave statistics
    const pendingLeaves = await Leave.countDocuments({ status: "Pending" });
    const approvedLeaves = await Leave.countDocuments({ status: "Approved" });
    const rejectedLeaves = await Leave.countDocuments({ status: "Rejected" });
    
    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentLogs = await Log.countDocuments({ timestamp: { $gte: sevenDaysAgo } });
    const recentLeaves = await Leave.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
    const recentEmployees = await Employee.countDocuments({ createdAt: { $gte: sevenDaysAgo } });
    
    // Department breakdown
    const departmentBreakdown = await Employee.aggregate([
      { $group: { _id: "$department", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Recent activities
    const latestActivities = await Log.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .select('action user target timestamp category');
    
    // Leave requests by status
    const leaveStatusBreakdown = await Leave.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    
    const dashboard = {
      employeeStats: {
        total: totalEmployees,
        active: activeEmployees,
        onLeave: onLeaveEmployees,
        inactive: totalEmployees - activeEmployees - onLeaveEmployees
      },
      leaveStats: {
        pending: pendingLeaves,
        approved: approvedLeaves,
        rejected: rejectedLeaves,
        total: pendingLeaves + approvedLeaves + rejectedLeaves
      },
      recentActivity: {
        logs: recentLogs,
        leaves: recentLeaves,
        newEmployees: recentEmployees
      },
      departmentBreakdown,
      leaveStatusBreakdown,
      latestActivities,
      generatedAt: new Date()
    };
    
    res.json(dashboard);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Employee Dashboard (for regular employees)
router.get("/employee", authMiddleware, async (req, res) => {
  try {
    const employee = await Employee.findById(req.user.employeeId);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    
    // Get employee's leave requests
    const leaveRequests = await Leave.find({ employee: req.user.employeeId })
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Get employee's recent activities
    const recentActivities = await Log.find({ 
      userId: req.user.id,
      timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    })
      .sort({ timestamp: -1 })
      .limit(10)
      .select('action target timestamp');
    
    // Calculate leave utilization
    const totalLeaveDays = leaveRequests
      .filter(leave => leave.status === 'Approved')
      .reduce((sum, leave) => sum + (leave.days || 0), 0);
    
    const dashboard = {
      employee: {
        name: `${employee.firstName} ${employee.lastName}`,
        employeeId: employee.employeeId,
        department: employee.department,
        jobRole: employee.jobRole,
        status: employee.status,
        dateOfJoining: employee.dateOfJoining
      },
      leaveBalance: employee.leaveBalance,
      leaveUtilization: {
        totalDays: totalLeaveDays,
        requests: leaveRequests.length,
        pending: leaveRequests.filter(l => l.status === 'Pending').length
      },
      recentLeaveRequests: leaveRequests,
      recentActivities,
      generatedAt: new Date()
    };
    
    res.json(dashboard);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ System Health Check
router.get("/health", authMiddleware, checkRole(["Admin"]), async (req, res) => {
  try {
    const health = {
      database: "Connected",
      employees: await Employee.countDocuments(),
      leaves: await Leave.countDocuments(),
      logs: await Log.countDocuments(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date()
    };
    
    res.json(health);
  } catch (err) {
    res.status(500).json({ 
      database: "Error",
      error: err.message,
      timestamp: new Date()
    });
  }
});

module.exports = router;
