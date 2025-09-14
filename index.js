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
const allowedOrigins = (process.env.CORS_ORIGINS || 'https://ziway-rose-plc-hrms.vercel.app,http://localhost:5173,')
  .split(',')
  .map((s) => s.trim());
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
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

// --- HEALTH CHECK ENDPOINT ---
app.get("/health", (req, res) => {
  const healthCheck = {
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
    memory: process.memoryUsage(),
    pid: process.pid
  };
  
  try {
    res.status(200).json(healthCheck);
  } catch (error) {
    healthCheck.status = "ERROR";
    healthCheck.error = error.message;
    res.status(503).json(healthCheck);
  }
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

// --- 404 HANDLER ---
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// --- ERROR HANDLING MIDDLEWARE ---
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: errors
    });
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }
  
  // Default error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
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
