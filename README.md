# HRMS - Logging and Reporting System

A comprehensive Human Resource Management System with advanced logging and reporting capabilities.

## 🚀 Features

### 📝 Comprehensive Logging
- **Action Tracking**: Logs all key actions (employee management, leave approvals, profile updates)
- **Detailed Audit Trail**: Includes IP address, user agent, timestamps, and user details
- **Categorized Logs**: Organizes logs by category (Employee, Leave, Approval, System, Report)
- **Severity Levels**: Critical, High, Medium, Low for different action types

### 📊 Advanced Reporting
- **Headcount Reports**: Employee statistics by department, role, and status
- **Leave Balance Reports**: Individual and department-wide leave balances
- **Leave Usage Reports**: Leave utilization trends and approval rates
- **Activity Log Reports**: System activity with filtering and search
- **Department Performance Reports**: Performance metrics by department
- **Data Export**: CSV export functionality for all reports

### 🏖️ Leave Management
- **Leave Requests**: Employees can request different types of leave
- **Approval Workflow**: HR/Admin approval process
- **Status Management**: Pending, Approved, Rejected, Cancelled states

### 📈 Dashboard
- **Admin Dashboard**: Overview of system metrics and recent activities
- **Employee Dashboard**: Personal leave balance and activity history
- **Real-time Statistics**: Live data on employees, leaves, and system health

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/signup` - Employee self-registration (creates `User` + `Employee`)
- `POST /api/auth/signin` - Sign in with email and password (returns JWT)
- `POST /api/auth/test-login` - Generate a dev JWT (Admin/HR/Staff) for testing
- `GET /api/auth/verify` - Verify a JWT token

### Employee Management
- `GET /api/employees` - Get all employees (with filtering)
- `POST /api/employees/add` - Add new employee (Admin/HR)
- `GET /api/employees/:id` - Get employee by ID
- `PUT /api/employees/:id` - Update employee (Admin/HR)
- `DELETE /api/employees/:id` - Delete employee (Admin)
- `PUT /api/employees/profile/update` - Update own profile (limited fields)
- `GET /api/employees/:id/leave-balance` - Get employee leave balance

### Leave Management
- `POST /api/leaves/request` - Request leave (Staff or Admin/HR on behalf)
- `GET /api/leaves/my` - Get the signed-in employee's leave requests
- `GET /api/leaves` - Get all leave requests (Admin/HR)
- `PUT /api/leaves/:id/approve` - Approve leave (Admin/HR)
- `PUT /api/leaves/:id/reject` - Reject leave (Admin/HR)
- `PUT /api/leaves/:id/cancel` - Cancel own pending leave (Staff) or Admin/HR

### Reports
- `GET /api/reports/headcount` - Headcount report
- `GET /api/reports/leave-balances` - Leave balance report
- `GET /api/reports/leave-usage` - Leave usage report
- `GET /api/reports/activity-logs` - Activity log report
- `GET /api/reports/department-performance` - Department performance report
- `GET /api/reports/export/:reportType` - Export report data

### Dashboard
- `GET /api/dashboard/overview` - Admin dashboard overview
- `GET /api/dashboard/employee` - Employee dashboard
- `GET /api/dashboard/health` - System health check

## 📋 Data Models

### Employee Model
```javascript
{
  firstName: String,
  lastName: String,
  email: String,
  department: String,
  jobRole: String,
  status: ["Active", "Inactive"],
  dateOfJoining: Date,
  employeeId: String
}
```

### Leave Model
```javascript
{
  employee: ObjectId,
  type: String, // e.g. "annual", "sick", "personal"
  startDate: Date,
  endDate: Date,
  days: Number,
  reason: String,
  status: ["Pending", "Approved", "Rejected", "Cancelled"],
  decidedBy: ObjectId,
  decidedAt: Date
}
```

### Log Model
```javascript
{
  action: String,
  user: String,
  userId: ObjectId,
  target: String,
  targetId: ObjectId,
  details: Object,
  ipAddress: String,
  userAgent: String,
  category: ["Employee", "Leave", "Approval", "System", "Report"],
  severity: ["Low", "Medium", "High", "Critical"],
  timestamp: Date
}
```

## 🔐 Security & Roles
- Roles: `Admin`, `HR`, `Staff`
- Use the returned JWT in `Authorization: Bearer <token>` header for protected routes
- Approve/Reject requires `Admin` or `HR`
- Cancel allowed by request owner (Staff) or `Admin/HR`

## 📊 Report Examples

### Headcount Report
```json
{
  "summary": {
    "total": 150,
    "active": 140,
    "inactive": 10
  },
  "byDepartment": [{"_id": "Engineering", "count": 45}],
  "byJobRole": [{"_id": "Software Engineer", "count": 25}]
}
```

### Leave Balance Report
```json
{
  "employees": [
    {
      "employeeId": "EMP001",
      "name": "John Doe",
      "department": "Engineering",
      "leaveBalance": { "annual": 15, "sick": 8, "personal": 3 },
      "totalBalance": 26
    }
  ]
}
```

## 🚀 Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set up MongoDB**
   - Ensure MongoDB is running
   - Update connection string in `db.js`

3. **Start the Server**
   ```bash
   npm start
   ```

4. **Access the API**
   - Server runs on `http://localhost:3000`

## 🌐 Deployment (Render)

This repository includes `render.yaml` to deploy both services:

- Backend (`hrmss`): Node web service. Configure env vars in Render Dashboard:
  - `MONGODB_URI`: your MongoDB connection string
  - `JWT_SECRET`: secret for signing JWTs
  - `CORS_ORIGINS`: comma-separated origins (e.g. your frontend URL)

- Frontend (`hrms-frontend`): Static site using Vite. `VITE_API_BASE_URL` is automatically set from the backend service URL.

Steps:
1. Push to GitHub.
2. In Render, New > Blueprint and select this repo. Render will create both services.
3. Set `MONGODB_URI` (and optional `CORS_ORIGINS`) on the backend service.
4. Deploy. Frontend will use the backend URL via `VITE_API_BASE_URL`.

## 📝 Usage Examples

### 1) Signup (Employee self-registration)
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@company.com",
    "password": "password123",
    "department": "Engineering",
    "jobRole": "Software Engineer"
  }'
```

### 2) Signin (get JWT)
```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@company.com",
    "password": "password123"
  }'
```

### 3) Dev token (Admin) for quick testing
```bash
curl -X POST http://localhost:3000/api/auth/test-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company.com",
    "role": "Admin"
  }'
```

### 4) Request leave (Staff)
```bash
curl -X POST http://localhost:3000/api/leaves/request \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "annual",
    "startDate": "2024-02-01",
    "endDate": "2024-02-05",
    "reason": "Family vacation"
  }'
```

### 5) Approve leave (Admin/HR)
```bash
curl -X PUT http://localhost:3000/api/leaves/LEAVE_ID/approve \
  -H "Authorization: Bearer YOUR_ADMIN_OR_HR_TOKEN" \
  -H "Content-Type: application/json"
```

### 6) Reject leave (Admin/HR)
```bash
curl -X PUT http://localhost:3000/api/leaves/LEAVE_ID/reject \
  -H "Authorization: Bearer YOUR_ADMIN_OR_HR_TOKEN" \
  -H "Content-Type: application/json"
```

### 7) Cancel my leave (Staff)
```bash
curl -X PUT http://localhost:3000/api/leaves/LEAVE_ID/cancel \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### 8) My leaves (Staff)
```bash
curl -X GET http://localhost:3000/api/leaves/my \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔧 Configuration

### Environment Variables
- `PORT`: Server port (default: 3000)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: JWT secret key (must match across sign/verify)

## ⚠️ Troubleshooting
- **Cannot POST/PUT ...%0A**: Remove trailing newline/encoded characters from URL.
- **No token, authorization denied**: Missing `Authorization: Bearer <token>` header.
- **Token is not valid**: Re-sign in or use `/api/auth/test-login`; ensure secrets match.
- **Access denied**: Your role lacks permission. Use Admin/HR for approve/reject.
- **Leave not pending**: Approve/Reject only works on `Pending` leaves.

## 📈 Monitoring
- **System Health**: `/api/dashboard/health`

## 🤝 Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License
This project is licensed under the MIT License.

## 🆘 Support
For support and questions, please contact the development team or create an issue in the repository.
