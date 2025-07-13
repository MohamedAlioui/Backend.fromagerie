# Fromagerie Invoice Backend

This is the backend API for the Fromagerie Invoice application, designed to run on Vercel as serverless functions.

## Features

- Express.js REST API
- MongoDB integration with Mongoose
- JWT Authentication
- User management
- Invoice management
- Client management
- PDF generation with Puppeteer

## Deployment on Vercel

### Prerequisites

1. MongoDB Atlas account (or other MongoDB hosting)
2. Vercel account

### Environment Variables

Set these environment variables in your Vercel dashboard:

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fromagerie-invoice?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

### Deployment Steps

1. **Push to GitHub**: Make sure your code is in a GitHub repository

2. **Connect to Vercel**:

   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Select the `backend` folder as the root directory

3. **Configure Build Settings**:

   - Framework Preset: `Other`
   - Root Directory: `backend`
   - Build Command: `npm run build`
   - Output Directory: (leave empty)
   - Install Command: `npm install`

4. **Set Environment Variables**:

   - In your Vercel project settings, add all the environment variables listed above

5. **Deploy**: Click "Deploy"

### API Endpoints

- `GET /api/health` - Health check
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/invoices` - Get all invoices (protected)
- `POST /api/invoices` - Create invoice (protected)
- `GET /api/clients` - Get all clients (protected)
- `POST /api/clients` - Create client (protected)
- `GET /api/users` - Get all users (admin only)

### Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values

# Start development server
npm run dev
```

### Project Structure

```
backend/
├── api/
│   └── index.js          # Vercel serverless entry point
├── routes/
│   ├── authRoutes.js     # Authentication routes
│   ├── userRoutes.js     # User management routes
│   ├── clientRoutes.js   # Client management routes
│   └── invoiceRoutes.js  # Invoice management routes
├── models/
│   ├── User.js           # User model
│   ├── Client.js         # Client model
│   └── Invoice.js        # Invoice model
├── middleware/
│   └── auth.js           # JWT authentication middleware
├── utils/
├── server.js             # Main server file (for local development)
├── vercel.json           # Vercel configuration
└── package.json          # Dependencies and scripts
```

### Troubleshooting

1. **MongoDB Connection Issues**:

   - Ensure your MongoDB URI is correct
   - Check that your IP is whitelisted in MongoDB Atlas
   - Verify network access settings

2. **CORS Issues**:

   - Set the correct `FRONTEND_URL` environment variable
   - Ensure your frontend domain is properly configured

3. **Function Timeout**:

   - Vercel has a 10-second timeout for Hobby plans
   - Consider upgrading to Pro for longer timeouts
   - Optimize database queries

4. **Cold Start Issues**:
   - First request might be slower due to serverless cold starts
   - Connection pooling is configured to minimize this impact

### Performance Tips

- Database connections are cached and reused across function invocations
- Connection pooling is optimized for serverless environments
- Queries are designed to be efficient and fast
