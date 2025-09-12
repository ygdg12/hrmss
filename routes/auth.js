const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Employee = require("../models/Employee");

// SIGNUP (Employee self-registration)
router.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, email, password, department, jobRole, employeeId } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: "firstName, lastName, email, and password are required" });
    }

    // 1. Check if user already exists
    let existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "User already exists" });

    // 2. Check if employeeId is unique (if provided)
    if (employeeId) {
      let existingEmployee = await Employee.findOne({ employeeId });
      if (existingEmployee) return res.status(400).json({ error: "Employee ID already exists" });
    }

    // 3. Create Employee profile
    const employee = await Employee.create({
      firstName,
      lastName,
      email,
      department: department || "Unassigned",
      jobRole: jobRole || "Staff",
      employeeId: employeeId || `EMP${Date.now()}`,
      status: "Active"
    });

    // 4. Create User (login credentials)
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hashed,
      role: req.body.role || "Staff", // default role for signup
      employeeId: employee._id,       // link to employee profile
    });

    // 5. Return JWT
    const token = jwt.sign(
      { id: user._id, role: user.role, employeeId: employee._id },
      process.env.JWT_SECRET || "mysecret",
      { expiresIn: "1d" }
    );

    res.status(201).json({
      message: "Signup successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        employeeId: employee._id
      },
      employee
    });

  } catch (e) {
    console.error("Signup error:", e);
    res.status(500).json({ error: e.message });
  }
});

// --- SIGNIN ---
router.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  // ✅ Hardcoded Admin login (bypass DB)
  if (email === "admin@company.com" && password === "SecurePass123") {
    const payload = {
      id: "hardcoded-admin-id",
      email: "admin@company.com",
      role: "Admin",
      employeeId: "hardcoded-employee-id"
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || "mysecret", { expiresIn: "1h" });

    return res.json({
      message: "Admin login successful",
      token,
      user: payload
    });
  }

  // 🟢 Normal user login
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid email or password" });

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role, employeeId: user.employeeId },
      process.env.JWT_SECRET || "mysecret",
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: { email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("Signin error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Test login route for development
router.post("/test-login", (req, res) => {
  try {
    const { email, role = "Admin" } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const payload = {
      id: "test-user-id",
      email: email,
      role: role,
      employeeId: "test-employee-id"
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || "mysecret", { expiresIn: "24h" });

    res.json({
      message: "Test login successful",
      token: token,
      user: payload
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Verify token route
router.get("/verify", (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "mysecret");
    
    res.json({
      message: "Token is valid",
      user: decoded
    });
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
});

module.exports = router;
