# 🚨 EMERGENCY DEPLOYMENT GUIDE

## DEPLOYMENT_NOT_FOUND - Step by Step Fix

### STRATEGY 1: Test with Minimal Function First

1. **Create a test vercel.json** (temporarily replace the existing one):

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/test.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/api/test.js"
    }
  ]
}
```

2. **Commit and deploy the test**:

```bash
git add .
git commit -m "Test minimal deployment"
git push
```

3. **If test works**, then switch back to the full API by reverting vercel.json:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/api/index.js"
    }
  ]
}
```

### STRATEGY 2: Check Vercel Project Settings

1. Go to Vercel Dashboard → Your Project → Settings
2. **General Settings**:

   - Framework Preset: `Other`
   - Root Directory: `backend`
   - Build Command: `npm run build`
   - Output Directory: (leave empty)
   - Install Command: `npm install`

3. **Environment Variables** (Required):
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Random 32+ character string
   - `NODE_ENV`: production

### STRATEGY 3: Nuclear Option - Fresh Deployment

If nothing works:

1. **Delete the Vercel project**:

   - Settings → Advanced → Delete Project

2. **Create new project**:

   - Import from GitHub again
   - Choose `backend` folder as root
   - Set framework to "Other"

3. **Add environment variables**

4. **Deploy**

### STRATEGY 4: Check Build Logs

1. Go to Deployments tab
2. Click on the failed deployment
3. Check **Build Logs** for specific errors
4. Common issues:
   - Import/export errors
   - Missing dependencies
   - Syntax errors

### STRATEGY 5: Local Testing

Test locally first:

```bash
cd backend
npm install
node api/index.js
```

If local fails, fix the errors first.

### STRATEGY 6: Dependency Issues

Try this minimal package.json:

```json
{
  "name": "fromagerie-invoice-backend",
  "version": "1.0.0",
  "type": "module",
  "main": "api/index.js",
  "scripts": {
    "build": "echo 'Build completed'"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "bcryptjs": "^3.0.2",
    "jsonwebtoken": "^9.0.2"
  },
  "engines": {
    "node": "18.x"
  }
}
```

### STRATEGY 7: File Structure Check

Ensure this exact structure:

```
backend/
├── api/
│   ├── index.js          ← Main serverless function
│   └── test.js           ← Test function
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── clientRoutes.js
│   └── invoiceRoutes.js
├── models/
│   └── User.js
├── middleware/
│   └── auth.js
├── package.json
├── vercel.json
└── server.js
```

### STRATEGY 8: Emergency Simple API

Replace api/index.js with this minimal version:

```javascript
import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "API is working!",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Health check passed",
  });
});

export default app;
```

## EXECUTION PRIORITY

Try strategies in this order:

1. Strategy 2 (Check settings) - 2 minutes
2. Strategy 4 (Check logs) - 5 minutes
3. Strategy 6 (Minimal package.json) - 5 minutes
4. Strategy 1 (Test function) - 10 minutes
5. Strategy 8 (Simple API) - 10 minutes
6. Strategy 3 (Nuclear option) - 15 minutes

## SUCCESS INDICATORS

✅ Deployment shows "Ready" status
✅ URL loads without 404 error
✅ API returns JSON response
✅ Health endpoint works

## COMMON ERROR SOLUTIONS

**"Cannot resolve module"** → Check import paths
**"Build failed"** → Check package.json syntax
**"Function timeout"** → Simplify the function
**"Missing dependency"** → Add to package.json

## EMERGENCY CONTACT

If all fails:

1. Check Vercel Status page
2. Vercel Discord community
3. Create new repository with minimal code
