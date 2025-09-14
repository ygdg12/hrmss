# HRMS Deployment Guide for Render

This guide will help you deploy your HRMS (Human Resource Management System) to Render.

## Prerequisites

1. A Render account (free tier available)
2. A MongoDB Atlas account (free tier available)
3. Your project code in a Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Prepare Your Environment Variables

Before deploying, you need to set up the following environment variables in Render:

### Required Environment Variables

1. **MONGODB_URI**: Your MongoDB Atlas connection string
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority`
   - Get this from your MongoDB Atlas dashboard
   - **IMPORTANT**: Never commit this to your repository

2. **JWT_SECRET**: A secure secret key for JWT token signing
   - Generate a strong random string (at least 32 characters)
   - Example: `your-super-secret-jwt-key-here-32-chars-min`
   - **IMPORTANT**: Keep this secret and never commit it to your repository

### Optional Environment Variables

- **JWT_EXPIRE**: JWT token expiration time (default: 7d)
- **MAX_FILE_SIZE**: Maximum file upload size in bytes (default: 5242880 = 5MB)
- **UPLOAD_PATH**: Path for file uploads (default: ./uploads)
- **CORS_ORIGINS**: Comma-separated list of allowed origins (default: "*" for production)
- **NODE_ENV**: Environment mode (automatically set to "production" in render.yaml)

## Project Structure for Deployment

The project has been optimized for Render deployment with the following structure:

```
├── .env.example          # Template for environment variables
├── .gitignore           # Git ignore file (excludes .env, node_modules, etc.)
├── Procfile             # Process file for deployment platforms
├── render.yaml          # Render deployment configuration
├── package.json         # Dependencies and scripts
├── index.js            # Main application file
├── db.js               # Database connection (secure, no hardcoded credentials)
├── middleware/         # Authentication and utility middleware
├── models/            # MongoDB models
├── routes/            # API routes
├── utils/             # Utility functions
└── uploads/           # File upload directory (not persistent on free tier)
```

### Security Improvements

- ✅ Removed hardcoded MongoDB credentials
- ✅ Environment variables properly configured
- ✅ Enhanced error handling middleware
- ✅ Improved CORS configuration
- ✅ Better health check endpoint
- ✅ Proper .gitignore to exclude sensitive files

## Step 2: Deploy to Render

### Method 1: Using render.yaml (Recommended)

1. Push your code to your Git repository
2. In Render dashboard, click "New +" → "Blueprint"
3. Connect your repository
4. Render will automatically detect the `render.yaml` file
5. Review the configuration and click "Apply"

### Method 2: Manual Setup

1. In Render dashboard, click "New +" → "Web Service"
2. Connect your Git repository
3. Configure the service:
   - **Name**: hrmss-api
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/health`

## Step 3: Configure Environment Variables

1. In your Render service dashboard, go to "Environment"
2. Add the required environment variables:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Your JWT secret key
   - `NODE_ENV`: production

## Step 4: Deploy

1. Click "Deploy" in your Render service
2. Monitor the build logs for any errors
3. Once deployed, your API will be available at the provided URL

## Step 5: Test Your Deployment

After successful deployment, test these endpoints:

- **Health Check**: `GET https://your-app.onrender.com/health`
  - Returns detailed system information including memory usage, uptime, and process details
- **API Info**: `GET https://your-app.onrender.com/`
  - Returns API documentation and available endpoints
- **Authentication**: `POST https://your-app.onrender.com/api/auth/login`
  - Test user authentication

### Enhanced Health Check Response

The health check endpoint now provides comprehensive system information:

```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "version": "1.0.0",
  "memory": {
    "rss": 45678912,
    "heapTotal": 20971520,
    "heapUsed": 15728640,
    "external": 1234567
  },
  "pid": 1234
}
```

## API Endpoints

Your deployed HRMS API will have the following endpoints:

- `/api/auth` - Authentication (login, register)
- `/api/employees` - Employee management
- `/api/leaves` - Leave management
- `/api/attendance` - Attendance tracking
- `/api/shifts` - Shift management
- `/api/reports` - Reports generation
- `/api/dashboard` - Dashboard data
- `/health` - Health check for monitoring

## Troubleshooting

### Common Issues

1. **Build Failures**: Check that all dependencies are in `package.json`
2. **Database Connection**: Verify your MongoDB URI is correct
3. **Environment Variables**: Ensure all required variables are set
4. **File Uploads**: Note that file uploads may not persist on free tier

### Logs

Check the Render service logs for debugging:
1. Go to your service dashboard
2. Click on "Logs" tab
3. Review build and runtime logs

## Free Tier Limitations

- Service may sleep after 15 minutes of inactivity
- Cold starts may take 30+ seconds
- File uploads are not persistent (use cloud storage for production)
- Limited to 750 hours per month

## Production Considerations

For production deployment, consider:

1. **Database**: Use a dedicated MongoDB cluster
2. **File Storage**: Use AWS S3, Cloudinary, or similar for file uploads
3. **Monitoring**: Set up proper logging and monitoring
4. **Security**: Use HTTPS, implement rate limiting, and proper CORS
5. **Scaling**: Consider upgrading to a paid plan for better performance

## Deployment Checklist

Before deploying, ensure you have:

- [ ] Created a MongoDB Atlas cluster and obtained connection string
- [ ] Generated a secure JWT secret (32+ characters)
- [ ] Set up your Git repository (GitHub, GitLab, or Bitbucket)
- [ ] Committed all code changes (excluding .env file)
- [ ] Verified all environment variables are properly configured
- [ ] Tested the application locally with production environment variables

## Quick Deploy Commands

```bash
# 1. Initialize git repository (if not already done)
git init
git add .
git commit -m "Initial commit - ready for deployment"

# 2. Add remote repository
git remote add origin <your-repository-url>
git push -u origin main

# 3. Deploy to Render
# - Go to Render dashboard
# - Create new Web Service
# - Connect your repository
# - Configure environment variables
# - Deploy!
```

## Support

If you encounter issues:

1. Check the Render documentation
2. Review your application logs in Render dashboard
3. Verify your environment variables are set correctly
4. Test your API endpoints using the health check
5. Check MongoDB Atlas connection and network access

### Common Error Solutions

- **Build Failures**: Ensure all dependencies are in `package.json`
- **Database Connection**: Verify MongoDB URI and network access
- **Environment Variables**: Double-check all required variables are set
- **CORS Issues**: Verify CORS_ORIGINS configuration

---

**Note**: This deployment guide assumes you're using the free tier. For production applications, consider upgrading to a paid plan for better performance and reliability.
