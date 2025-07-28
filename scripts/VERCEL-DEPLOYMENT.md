# Vercel Deployment Guide for MOT.AI

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Push your code to GitHub
3. **Database**: Set up a PostgreSQL database (Neon, Supabase, or other)
4. **DVSA API Credentials**: Get your credentials from the DVSA API portal

## Quick Deployment Steps

### 1. Connect to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect it's a Node.js project

### 2. Configure Build Settings
Vercel will automatically detect the configuration from `vercel.json`:
- **Framework Preset**: Other (auto-detected)
- **Build Command**: `npm run build` (from vercel.json)
- **Output Directory**: `dist/public` (from vercel.json)
- **Install Command**: `npm ci` (auto-detected)

**Important**: The project uses Vercel configuration with proper API routing:
- Frontend assets are served from `dist/public`
- API routes (`/api/*`) are handled by the `api/[...path].js` serverless function
- All API requests are routed to the Express app
- The Express app is automatically initialized for each request

### 3. Set Environment Variables
In your Vercel project dashboard, go to Settings → Environment Variables and add:

#### Required Database Configuration
```
DATABASE_URL=postgresql://username:password@host:port/database
```

#### DVSA API Credentials (Required for real data)
```
DVSA_CLIENT_ID=your_client_id_here
DVSA_CLIENT_SECRET=your_client_secret_here
DVSA_TOKEN_URL=https://login.microsoftonline.com/{tenant-id}/oauth2/v2.0/token
DVSA_API_KEY=your_api_key_here
```

#### Optional Configuration
```
NODE_ENV=production
```

### 4. Database Setup Options

#### Option A: Neon Database (Recommended)
1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Add it as `DATABASE_URL` in Vercel

#### Option B: Supabase
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Get the PostgreSQL connection string
4. Add it as `DATABASE_URL` in Vercel

#### Option C: Railway/PlanetScale
Follow their respective setup guides and use the connection string

### 5. Deploy
1. Click "Deploy" in Vercel
2. Wait for the build to complete
3. Your app will be available at `https://your-project.vercel.app`

## Post-Deployment Setup

### Initialize Database Schema
After first deployment, you need to set up the database tables:

1. **Using Drizzle Push** (Recommended):
   ```bash
   # In your local environment with DATABASE_URL set
   npm run db:push
   ```

2. **Manual SQL Setup**:
   Connect to your database and run the SQL from `scripts/setup-local-db.sql`

### Test the Deployment
1. Visit your Vercel URL
2. Go to `/api-test` to test the DVSA API connection
3. Try searching for a UK vehicle registration

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `DVSA_CLIENT_ID` | ✅ | OAuth2 client ID from DVSA |
| `DVSA_CLIENT_SECRET` | ✅ | OAuth2 client secret from DVSA |
| `DVSA_TOKEN_URL` | ✅ | Full OAuth2 token URL with tenant ID |
| `DVSA_API_KEY` | ✅ | API key from DVSA portal |
| `NODE_ENV` | ❌ | Set to "production" (usually auto-set) |

## Troubleshooting

### Build Failures
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify TypeScript compilation passes locally
- Make sure `npm run build` works locally first

### API Route Issues (404 Errors)
- **Most Common**: API routes returning 404 means Vercel isn't routing `/api/*` to the serverless function
- Verify the `api/[...path].js` file exists and is properly configured
- Check that `vercel.json` has the correct routes configuration
- Test `/api-test` endpoint first to verify API routing
- Ensure the built `dist/index.js` file exports `initializeApp` function properly
- Check Vercel function logs for import/export errors

### Database Connection Issues
- Verify `DATABASE_URL` format is correct
- Check database server allows external connections
- Test connection locally first
- For Neon: Ensure WebSocket connections are allowed

### DVSA API Issues
- Verify all four DVSA credentials are correct
- Check API credentials haven't expired  
- Test with `/api-test` endpoint
- Verify OAuth2 token URL includes correct tenant ID

### Module Import Errors
- If you see "Cannot find module" errors, ensure all imports use `.js` extensions in the built code
- Check that the build process completed successfully
- Verify all dependencies are listed in `package.json`

### Performance Optimization
- Database queries are optimized for Vercel's serverless functions
- Static assets are served via Vercel's CDN
- Function timeout is set to 30 seconds for complex API calls

## Continuous Deployment
Once connected to GitHub:
1. Push changes to your main branch
2. Vercel automatically rebuilds and deploys
3. Monitor deployments in the Vercel dashboard

## Custom Domain (Optional)
1. Go to project Settings → Domains
2. Add your custom domain
3. Configure DNS as instructed by Vercel

Your MOT.AI application will be live and automatically scale with traffic!