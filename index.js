const express = require("express");
const connectDB = require("./db");
const authRoutes = require("./routes/auth");
const employeeRoutes = require("./routes/employees");
const leaveRoutes = require("./routes/leaves");
const reportRoutes = require("./routes/reports");
const dashboardRoutes = require("./routes/dashboard");

const app = express();
app.use(express.json());

// --- CONNECT TO MONGODB ---
connectDB();

// --- ROUTES ---
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/leaves", require("./routes/leaves"));
app.use("/api/attendance", require("./routes/attendance"));
app.use("/api/shifts", require("./routes/shifts"));

app.use("/api/dashboard", dashboardRoutes);

// --- HEALTH CHECK ENDPOINT ---
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development"
  });
});

// --- ROOT ENDPOINT ---
app.get("/", (req, res) => {
  res.json({
    message: "HRMS API Server",
    version: "1.0.0",
    status: "running",
    endpoints: {
      auth: "/api/auth",
      employees: "/api/employees",
      leaves: "/api/leaves",
      attendance: "/api/attendance",
      shifts: "/api/shifts",
      reports: "/api/reports",
      dashboard: "/api/dashboard",
      health: "/health"
    }
  });
});

// --- START SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 Reports available at http://localhost:${PORT}/api/reports`);
  console.log(`👥 Employees API at http://localhost:${PORT}/api/employees`);
  console.log(`🏖️  Leave Management at http://localhost:${PORT}/api/leaves`);
  console.log(`📈 Dashboard at http://localhost:${PORT}/api/dashboard`);
});
