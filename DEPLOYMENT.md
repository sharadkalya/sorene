# Deployment Guide

## Environment Variables

This application requires the following environment variables to be set:

### Required Variables

- `MONGODB_URI` - MongoDB Atlas connection string

### Local Development

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Update `.env.local` with your actual MongoDB connection string:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/database?retryWrites=true&w=majority
   ```

3. Never commit `.env.local` to git (it's already in `.gitignore`)

### Production Deployment (Vercel)

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variable:
   - **Name**: `MONGODB_URI`
   - **Value**: Your MongoDB connection string
   - **Environment**: Production, Preview, Development (select as needed)

4. Redeploy your application after adding the environment variable

### Important Notes

- The application will use a default theme (`sorvene`) during build phase when MongoDB is not accessible
- Theme settings are fetched from MongoDB at runtime, not during build
- If MongoDB connection fails, the app gracefully falls back to the default theme
- Environment variables are **not** available during the Next.js build phase in Vercel

### Vercel Deployment Checklist

- [ ] MongoDB Atlas cluster is running and accessible
- [ ] MongoDB user has correct permissions
- [ ] Network access is configured (allow all IPs: `0.0.0.0/0` for serverless)
- [ ] `MONGODB_URI` environment variable is set in Vercel
- [ ] Database name in connection string matches your schema

### Troubleshooting

**Build fails with "MONGODB_URI not defined":**
- Ensure the environment variable is set in Vercel dashboard
- Check that the variable name is exactly `MONGODB_URI` (case-sensitive)
- Verify the variable is enabled for the correct environments

**App runs but theme doesn't persist:**
- Check MongoDB connection string is correct
- Verify database permissions
- Check Vercel logs for connection errors

**Theme resets on every deploy:**
- This is normal - the app will fetch the saved theme from MongoDB after deployment
- If you want a specific default theme, update the fallback value in `src/app/layout.tsx`
