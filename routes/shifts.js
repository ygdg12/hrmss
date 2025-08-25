const express = require("express");
const router = express.Router();
const Shift = require("../models/Shift");
const auth = require("../middleware/authMiddleware");
const checkRole = require("../middleware/checkRole");

// Create/assign shift (HR/Admin)
router.post("/", auth, checkRole(["Admin", "HR"]), async (req, res) => {
  try {
    const shift = await Shift.create(req.body);
    res.status(201).json(shift);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Update shift
router.put("/:id", auth, checkRole(["Admin", "HR"]), async (req, res) => {
  try {
    const shift = await Shift.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!shift) return res.status(404).json({ error: "Shift not found" });
    res.json(shift);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Get shifts (my or by employee)
router.get("/", auth, async (req, res) => {
  try {
    const { employee } = req.query;
    const filter = employee ? { employee } : { employee: req.user.employeeId };
    const shifts = await Shift.find(filter).sort({ createdAt: -1 });
    res.json(shifts);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Delete shift
router.delete("/:id", auth, checkRole(["Admin", "HR"]), async (req, res) => {
  try {
    const shift = await Shift.findByIdAndDelete(req.params.id);
    if (!shift) return res.status(404).json({ error: "Shift not found" });
    res.json({ message: "Shift deleted" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
