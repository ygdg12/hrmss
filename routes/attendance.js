const express = require("express");
const router = express.Router();
const Attendance = require("../models/Attendance");
const auth = require("../middleware/authMiddleware");
const checkRole = require("../middleware/checkRole");

// Clock-in (employee)
router.post("/clock-in", auth, async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    let record = await Attendance.findOne({ employee: req.user.employeeId, date: today });
    if (record && record.clockIn) return res.status(400).json({ error: "Already clocked in" });

    if (!record) {
      record = new Attendance({ employee: req.user.employeeId, date: today, clockIn: new Date(), source: "Web" });
    } else {
      record.clockIn = new Date();
    }
    await record.save();
    res.json(record);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Clock-out (employee)
router.post("/clock-out", auth, async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const record = await Attendance.findOne({ employee: req.user.employeeId, date: today });
    if (!record || !record.clockIn) return res.status(400).json({ error: "Not clocked in yet" });
    if (record.clockOut) return res.status(400).json({ error: "Already clocked out" });

    record.clockOut = new Date();
    record.totalMinutes = Math.max(0, Math.round((record.clockOut - record.clockIn) / 60000));
    await record.save();
    res.json(record);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// My attendance history
router.get("/my", auth, async (req, res) => {
  try {
    const { from, to } = req.query;
    const filter = { employee: req.user.employeeId };
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to)   filter.date.$lte = new Date(to);
    }
    const items = await Attendance.find(filter).sort({ date: -1 });
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin/HR: attendance by employee
router.get("/", auth, checkRole(["Admin", "HR"]), async (req, res) => {
  try {
    const { employee, from, to } = req.query;
    const filter = {};
    if (employee) filter.employee = employee;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to)   filter.date.$lte = new Date(to);
    }
    const items = await Attendance.find(filter).populate("employee", "firstName lastName email").sort({ date: -1 });
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
