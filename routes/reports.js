const express = require("express");
const router = express.Router();
const Employee = require("../models/Employee");
const Leave = require("../models/Leave");
const Log = require("../models/Log");
const authMiddleware = require("../middleware/authMiddleware");
const checkRole = require("../middleware/checkRole");
const { logReportGeneration } = require("../middleware/logger");

// ✅ Headcount Report
router.get("/headcount", authMiddleware, checkRole(["Admin", "HR"]), async (req, res) => {
  try {
    const { department, status, date } = req.query;
    
    let filter = {};
    if (department) filter.department = department;
    if (status) filter.status = status;
    if (date) {
      filter.dateOfJoining = { $lte: new Date(date) };
    }
    
    const total = await Employee.countDocuments(filter);
    const active = await Employee.countDocuments({ ...filter, status: "Active" });
    const inactive = await Employee.countDocuments({ ...filter, status: "Inactive" });
    const onLeave = await Employee.countDocuments({ ...filter, status: "On Leave" });
    const terminated = await Employee.countDocuments({ ...filter, status: "Terminated" });

    // By department
    const byDepartment = await Employee.aggregate([
      { $match: filter },
      { $group: { _id: "$department", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // By job role
    const byJobRole = await Employee.aggregate([
      { $match: filter },
      { $group: { _id: "$jobRole", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Monthly hiring trend (last 12 months)
    const monthlyHiring = await Employee.aggregate([
      { $match: { dateOfJoining: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: {
            year: { $year: "$dateOfJoining" },
            month: { $month: "$dateOfJoining" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } }
    ]);

    const report = {
      summary: { total, active, inactive, onLeave, terminated },
      byDepartment,
      byJobRole,
      monthlyHiring,
      generatedAt: new Date()
    };

    // Log report generation
    await logReportGeneration("Headcount Report", req.user.email, { department, status, date }, req);

    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Leave Balance Report
router.get("/leave-balances", authMiddleware, checkRole(["Admin", "HR"]), async (req, res) => {
  try {
    const { department, employeeId } = req.query;
    
    let filter = { status: "Active" };
    if (department) filter.department = department;
    if (employeeId) filter._id = employeeId;

    const employees = await Employee.find(filter, "firstName lastName employeeId department leaveBalance");
    
    const leaveBalances = employees.map(emp => ({
      employeeId: emp.employeeId,
      name: `${emp.firstName} ${emp.lastName}`,
      department: emp.department,
      leaveBalance: emp.leaveBalance,
      totalBalance: Object.values(emp.leaveBalance).reduce((sum, val) => sum + val, 0)
    }));

    // Summary statistics
    const summary = {
      totalEmployees: leaveBalances.length,
      averageAnnualLeave: leaveBalances.reduce((sum, emp) => sum + emp.leaveBalance.annual, 0) / leaveBalances.length,
      averageSickLeave: leaveBalances.reduce((sum, emp) => sum + emp.leaveBalance.sick, 0) / leaveBalances.length,
      lowBalanceEmployees: leaveBalances.filter(emp => emp.leaveBalance.annual < 5).length
    };

    const report = {
      employees: leaveBalances,
      summary,
      generatedAt: new Date()
    };

    // Log report generation
    await logReportGeneration("Leave Balance Report", req.user.email, { department, employeeId }, req);

    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Leave Usage Report
router.get("/leave-usage", authMiddleware, checkRole(["Admin", "HR"]), async (req, res) => {
  try {
    const { startDate, endDate, department, leaveType } = req.query;
    
    let filter = {};
    if (startDate && endDate) {
      filter.startDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (leaveType) filter.leaveType = leaveType;

    const leaves = await Leave.find(filter)
      .populate('employee', 'firstName lastName employeeId department')
      .populate('decidedBy', 'firstName lastName');

    // Filter by department if specified
    let filteredLeaves = leaves;
    if (department) {
      filteredLeaves = leaves.filter(leave => leave.employee.department === department);
    }

    // Group by leave type
    const byLeaveType = filteredLeaves.reduce((acc, leave) => {
      if (!acc[leave.leaveType]) {
        acc[leave.leaveType] = { total: 0, approved: 0, rejected: 0, pending: 0 };
      }
      acc[leave.leaveType].total += leave.daysRequested;
      acc[leave.leaveType][leave.status.toLowerCase()] += leave.daysRequested;
      return acc;
    }, {});

    // Group by department
    const byDepartment = filteredLeaves.reduce((acc, leave) => {
      const dept = leave.employee.department;
      if (!acc[dept]) {
        acc[dept] = { total: 0, approved: 0, rejected: 0, pending: 0 };
      }
      acc[dept].total += leave.daysRequested;
      acc[dept][leave.status.toLowerCase()] += leave.daysRequested;
      return acc;
    }, {});

    // Monthly trend
    const monthlyTrend = await Leave.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: "$startDate" },
            month: { $month: "$startDate" },
            status: "$status"
          },
          totalDays: { $sum: "$daysRequested" }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } }
    ]);

    const report = {
      summary: {
        totalRequests: filteredLeaves.length,
        totalDays: filteredLeaves.reduce((sum, leave) => sum + leave.daysRequested, 0),
        approvedDays: filteredLeaves.filter(l => l.status === 'Approved').reduce((sum, leave) => sum + leave.daysRequested, 0),
        rejectedDays: filteredLeaves.filter(l => l.status === 'Rejected').reduce((sum, leave) => sum + leave.daysRequested, 0)
      },
      byLeaveType,
      byDepartment,
      monthlyTrend,
      leaves: filteredLeaves,
      generatedAt: new Date()
    };

    // Log report generation
    await logReportGeneration("Leave Usage Report", req.user.email, { startDate, endDate, department, leaveType }, req);

    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Activity Log Report
router.get("/activity-logs", authMiddleware, checkRole(["Admin", "HR"]), async (req, res) => {
  try {
    const { startDate, endDate, action, category, user, limit = 100 } = req.query;
    
    let filter = {};
    if (startDate && endDate) {
      filter.timestamp = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (action) filter.action = action;
    if (category) filter.category = category;
    if (user) filter.user = { $regex: user, $options: 'i' };

    const logs = await Log.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    // Summary statistics
    const actionSummary = await Log.aggregate([
      { $match: filter },
      { $group: { _id: "$action", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const categorySummary = await Log.aggregate([
      { $match: filter },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const userSummary = await Log.aggregate([
      { $match: filter },
      { $group: { _id: "$user", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const report = {
      logs,
      summary: {
        totalLogs: logs.length,
        actionSummary,
        categorySummary,
        userSummary
      },
      generatedAt: new Date()
    };

    // Log report generation
    await logReportGeneration("Activity Log Report", req.user.email, { startDate, endDate, action, category, user }, req);

    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Department Performance Report
router.get("/department-performance", authMiddleware, checkRole(["Admin", "HR"]), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Get department statistics
    const departmentStats = await Employee.aggregate([
      { $group: { 
        _id: "$department", 
        employeeCount: { $sum: 1 },
        activeCount: { $sum: { $cond: [{ $eq: ["$status", "Active"] }, 1, 0] } },
        avgSalary: { $avg: "$salary" }
      }},
      { $sort: { employeeCount: -1 } }
    ]);

    // Get leave statistics by department
    let leaveFilter = {};
    if (startDate && endDate) {
      leaveFilter.startDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const leaveStats = await Leave.aggregate([
      { $match: leaveFilter },
      { $lookup: { from: "employees", localField: "employee", foreignField: "_id", as: "employeeData" } },
      { $unwind: "$employeeData" },
      { $group: {
        _id: "$employeeData.department",
        totalLeaveDays: { $sum: "$daysRequested" },
        approvedDays: { $sum: { $cond: [{ $eq: ["$status", "Approved"] }, "$daysRequested", 0] } },
        requestCount: { $sum: 1 }
      }},
      { $sort: { totalLeaveDays: -1 } }
    ]);

    // Combine the data
    const performanceReport = departmentStats.map(dept => {
      const leaveData = leaveStats.find(leave => leave._id === dept._id) || {
        totalLeaveDays: 0,
        approvedDays: 0,
        requestCount: 0
      };
      
      return {
        department: dept._id,
        employeeCount: dept.employeeCount,
        activeCount: dept.activeCount,
        avgSalary: dept.avgSalary,
        leaveUtilization: dept.employeeCount > 0 ? (leaveData.totalLeaveDays / dept.employeeCount) : 0,
        leaveApprovalRate: leaveData.totalLeaveDays > 0 ? (leaveData.approvedDays / leaveData.totalLeaveDays) * 100 : 0,
        ...leaveData
      };
    });

    const report = {
      departments: performanceReport,
      summary: {
        totalDepartments: performanceReport.length,
        totalEmployees: performanceReport.reduce((sum, dept) => sum + dept.employeeCount, 0),
        avgLeaveUtilization: performanceReport.reduce((sum, dept) => sum + dept.leaveUtilization, 0) / performanceReport.length
      },
      generatedAt: new Date()
    };

    // Log report generation
    await logReportGeneration("Department Performance Report", req.user.email, { startDate, endDate }, req);

    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Export Report Data (CSV format)
router.get("/export/:reportType", authMiddleware, checkRole(["Admin", "HR"]), async (req, res) => {
  try {
    const { reportType } = req.params;
    const { format = 'json' } = req.query;

    let data;
    switch (reportType) {
      case 'headcount':
        data = await Employee.find({}, 'firstName lastName employeeId department jobRole status dateOfJoining');
        break;
      case 'leave-balances':
        data = await Employee.find({ status: "Active" }, 'firstName lastName employeeId department leaveBalance');
        break;
      case 'leave-usage':
        data = await Leave.find().populate('employee', 'firstName lastName employeeId department');
        break;
      default:
        return res.status(400).json({ error: "Invalid report type" });
    }

    // Log export action
    await logReportGeneration(`Data Export - ${reportType}`, req.user.email, { format }, req);

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${reportType}-${Date.now()}.csv`);
      res.send(csv);
    } else {
      res.json(data);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Helper function to convert data to CSV
function convertToCSV(data) {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0].toObject ? data[0].toObject() : data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      return typeof value === 'string' ? `"${value}"` : value;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

module.exports = router;
