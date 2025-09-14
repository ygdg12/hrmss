const express = require("express");
const router = express.Router();

const Employee = require("../models/Employee");
const authMiddleware = require("../middleware/authMiddleware");
const checkRole = require("../middleware/checkRole");
const { logEmployeeAction } = require("../middleware/logger");
const upload = require("../middleware/upload"); // ✅ multer middleware for uploads
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// ✅ Test route to check if API is working
router.get("/test", (req, res) => {
  res.json({ message: "Employee API is working!", timestamp: new Date() });
});

// ✅ Add Employee (only HR, Admin). Optionally accepts password and role to create login
router.post("/add", authMiddleware, checkRole(["Admin", "HR"]), async (req, res) => {
  try {
    const { password, role = "Staff", email } = req.body;

    // Create Employee profile first
    const employeePayload = { ...req.body };
    delete employeePayload.password;
    delete employeePayload.role;
    const employee = new Employee(employeePayload);
    await employee.save();

    let createdUser = null;
    if (password) {
      // Ensure email is provided and unique for user account
      if (!email) {
        return res.status(400).json({ error: "Email is required when setting a password" });
      }
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ error: "A user with this email already exists" });
      }
      const hashed = await bcrypt.hash(password, 10);
      createdUser = await User.create({
        email,
        password: hashed,
        role: ["Admin", "HR", "Staff"].includes(role) ? role : "Staff",
        employeeId: employee._id
      });
    }

    // Log action
    await logEmployeeAction("Employee Added", employee, req.user.email, req);

    res.status(201).json({ employee, user: createdUser ? { id: createdUser._id, email: createdUser.email, role: createdUser.role } : null });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ Get All Employees (with filters)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { department, status, search } = req.query;

    let filter = {};
    if (department) filter.department = department;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    const employees = await Employee.find(filter).sort({ createdAt: -1 });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Update Employee Profile (Employee can only update their own profile)
router.put("/profile/update", authMiddleware, async (req, res) => {
  try {
    const allowedFields = ["phone", "location"];
    const updateData = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    updateData.lastProfileUpdate = new Date();

    const employee = await Employee.findByIdAndUpdate(req.user.employeeId, updateData, { new: true });
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    await logEmployeeAction("Profile Updated", employee, req.user.email, req);

    res.json(employee);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ Upload employee document (HR/Admin only)
router.post("/:id/upload-doc", authMiddleware, checkRole(["Admin", "HR"]), upload.single("document"), async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    const newDoc = {
      type: req.body.type, // e.g. ID, Certificate, Contract
      filePath: req.file.path
    };

    employee.documents.push(newDoc);
    employee.lastProfileUpdate = new Date();
    await employee.save();

    await logEmployeeAction("Document Uploaded", employee, req.user.email, req);

    res.json({ message: "Document uploaded successfully", document: newDoc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get employee documents
router.get("/:id/documents", authMiddleware, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id, "firstName lastName documents");
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    res.json({ employee: `${employee.firstName} ${employee.lastName}`, documents: employee.documents });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get Employee by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json(employee);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Update Employee (HR, Admin)
router.put("/:id", authMiddleware, checkRole(["Admin", "HR"]), async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    employee.lastProfileUpdate = new Date();
    await employee.save();

    await logEmployeeAction("Employee Updated", employee, req.user.email, req);

    res.json(employee);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ Delete Employee (Admin only)
router.delete("/:id", authMiddleware, checkRole(["Admin"]), async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    await logEmployeeAction("Employee Deleted", employee, req.user.email, req);

    res.json({ message: "Employee deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get Employee Leave Balance
router.get("/:id/leave-balance", authMiddleware, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id, "firstName lastName employeeId leaveBalance");
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    // Permissions check
    if (
      req.user.role !== "Admin" &&
      req.user.role !== "HR" &&
      req.params.id !== req.user.employeeId
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json({
      employeeId: employee.employeeId,
      name: `${employee.firstName} ${employee.lastName}`,
      leaveBalance: employee.leaveBalance,
      totalBalance: Object.values(employee.leaveBalance).reduce((sum, val) => sum + val, 0),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
