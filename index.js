require('dotenv').config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./db");
const authRoutes = require("./routes/auth");
const employeeRoutes = require("./routes/employees");
const leaveRoutes = require("./routes/leaves");
const reportRoutes = require("./routes/reports");
const dashboardRoutes = require("./routes/dashboard");

const app = express();

// CORS configuration
const allowedOrigins = (process.env.CORS_ORIGINS || 'https://ziway-rose-plc-hrms.vercel.app')
  .split(',')
  .map((s) => s.trim());
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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

// --- START SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 Reports available at http://localhost:${PORT}/api/reports`);
  console.log(`👥 Employees API at http://localhost:${PORT}/api/employees`);
  console.log(`🏖️  Leave Management at http://localhost:${PORT}/api/leaves`);
  console.log(`📈 Dashboard at http://localhost:${PORT}/api/dashboard`);
});
