# Vercel Deployment Guide

## 🚨 URGENT: Fix for 404 Error

If you're getting 404 errors on your backend URL (like `https://facture-fromageriea-backendckend.vercel.app/`), follow these steps:

### Step 1: Check Environment Variables

Go to your Vercel backend project dashboard and ensure these environment variables are set:

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fromagerie-invoice?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

### Step 2: Redeploy

1. Go to your Vercel backend project
2. Click **Deployments** tab
3. Click **Redeploy** on the latest deployment
4. Wait for deployment to complete

### Step 3: Test Endpoints

After redeployment, test these URLs:

- `https://your-backend.vercel.app/` - Should show API info
- `https://your-backend.vercel.app/api/health` - Should show health status

## Quick Setup

### 1. Environment Variables in Vercel Dashboard

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fromagerie-invoice?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

### 2. Vercel Project Settings

- **Framework Preset**: Other
- **Root Directory**: `backend`
- **Build Command**: `npm run build`
- **Output Directory**: (leave empty)
- **Install Command**: `npm install`

### 3. Domain Configuration

After deployment, your API will be available at:

- `https://your-backend-domain.vercel.app/api/health`
- `https://your-backend-domain.vercel.app/api/auth/login`
- etc.

### 4. Update Frontend API URL

Update your frontend's environment variable:

```
VITE_API_BASE_URL=https://your-backend-domain.vercel.app/api
```

## File Structure Created

```
backend/
├── api/
│   └── index.js          # Serverless function entry point
├── package.json          # Dependencies for backend
├── vercel.json           # Vercel configuration
├── env.example           # Environment variables template
├── DEPLOYMENT.md         # This file
└── README.md             # Complete documentation
```

## Testing After Deployment

1. Test health endpoint: `GET https://your-domain.vercel.app/api/health`
2. Test CORS: Make a request from your frontend
3. Test authentication: `POST https://your-domain.vercel.app/api/auth/login`

## Common Issues

### 1. 404 NOT_FOUND Errors

- **Cause**: Incorrect vercel.json configuration or missing serverless function
- **Solution**: Ensure vercel.json routes all requests to `/api/index.js`
- **Fix**: Redeploy after updating configuration

### 2. Database Connection Errors

- **Cause**: Missing or incorrect MONGODB_URI
- **Solution**: Check MongoDB Atlas connection string and IP whitelist
- **Fix**: Add `0.0.0.0/0` to MongoDB Atlas IP whitelist

### 3. CORS Errors from Frontend

- **Cause**: Missing or incorrect FRONTEND_URL environment variable
- **Solution**: Set FRONTEND_URL to your frontend domain
- **Fix**: Update environment variable and redeploy

### 4. Function Timeout

- **Problem**: Requests taking too long
- **Solution**: Increase `maxDuration` in vercel.json (max 30s for hobby plan)
- **Fix**: Optimize database queries and connection pooling

## Environment Variables Guide

### Required

- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens (minimum 32 characters)

### Recommended

- `NODE_ENV`: Set to "production"
- `FRONTEND_URL`: Your frontend domain for CORS

### Optional

- `PORT`: Port number (not used in serverless, but good for local development)

## API Endpoints

After successful deployment, these endpoints will be available:

- `GET /` - API information and available endpoints
- `GET /api/health` - Health check with database status
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/invoices` - Get invoices (requires auth)
- `POST /api/invoices` - Create invoice (requires auth)
- `GET /api/clients` - Get clients (requires auth)
- `POST /api/clients` - Create client (requires auth)
- `GET /api/users` - Get users (admin only)

## Troubleshooting Commands

If you need to debug locally:

```bash
# Install dependencies
npm install

# Set up environment variables
cp env.example .env
# Edit .env with your values

# Start development server
npm run dev

# Test API endpoints
curl http://localhost:5000/api/health
```

## Performance Tips

- Database connections are cached and reused across function invocations
- Connection pooling is optimized for serverless environments
- Queries are designed to be efficient and fast
- Cold starts are minimized through connection caching
