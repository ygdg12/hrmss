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

2. **JWT_SECRET**: A secure secret key for JWT token signing
   - Generate a strong random string (at least 32 characters)
   - Example: `your-super-secret-jwt-key-here-32-chars-min`

### Optional Environment Variables

- **JWT_EXPIRE**: JWT token expiration time (default: 7d)
- **MAX_FILE_SIZE**: Maximum file upload size in bytes (default: 5242880 = 5MB)
- **UPLOAD_PATH**: Path for file uploads (default: ./uploads)

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
- **API Info**: `GET https://your-app.onrender.com/`
- **Authentication**: `POST https://your-app.onrender.com/api/auth/login`

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

## Support

If you encounter issues:

1. Check the Render documentation
2. Review your application logs
3. Verify your environment variables
4. Test your API endpoints

---

**Note**: This deployment guide assumes you're using the free tier. For production applications, consider upgrading to a paid plan for better performance and reliability.
