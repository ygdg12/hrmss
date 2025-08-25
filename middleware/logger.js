const Log = require("../models/Log");

// Enhanced logging function with more details
async function logAction(action, user, target = "", details = {}, req = null) {
  try {
    const logData = {
      action,
      user,
      target,
      details,
      category: getCategoryFromAction(action),
      severity: getSeverityFromAction(action),
      timestamp: new Date()
    };

    // Add request details if available
    if (req) {
      logData.ipAddress = req.ip || req.connection.remoteAddress;
      logData.userAgent = req.get('User-Agent');
      if (req.user) {
        logData.userId = req.user._id;
      }
    }

    await Log.create(logData);
  } catch (err) {
    console.error("Error logging action:", err.message);
  }
}

// Helper function to determine category from action
function getCategoryFromAction(action) {
  if (action.includes('Employee')) return 'Employee';
  if (action.includes('Leave')) return 'Leave';
  if (action.includes('Approval')) return 'Approval';
  if (action.includes('Report')) return 'Report';
  return 'System';
}

// Helper function to determine severity from action
function getSeverityFromAction(action) {
  if (action.includes('Deleted') || action.includes('Critical')) return 'Critical';
  if (action.includes('Approved') || action.includes('Rejected')) return 'High';
  if (action.includes('Updated') || action.includes('Added')) return 'Medium';
  return 'Low';
}

// Specific logging functions for common actions
async function logEmployeeAction(action, employee, user, req = null) {
  const target = `Employee: ${employee.firstName} ${employee.lastName} (${employee.employeeId})`;
  await logAction(action, user, target, { employeeId: employee._id }, req);
}

async function logLeaveAction(action, leave, user, req = null) {
  const target = `Leave Request: ${leave.leaveType} (${leave.daysRequested} days)`;
  await logAction(action, user, target, { 
    leaveId: leave._id, 
    employeeId: leave.employee,
    leaveType: leave.leaveType,
    status: leave.status 
  }, req);
}

async function logApprovalAction(action, target, approver, details = {}, req = null) {
  await logAction(action, approver, target, details, req);
}

async function logReportGeneration(reportType, user, filters = {}, req = null) {
  await logAction("Report Generated", user, `Report: ${reportType}`, { filters }, req);
}

module.exports = {
  logAction,
  logEmployeeAction,
  logLeaveAction,
  logApprovalAction,
  logReportGeneration
};
