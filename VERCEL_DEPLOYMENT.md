# Frontend Deployment on Vercel

## Quick Setup

1. **Connect Repository to Vercel**
   - Go to https://vercel.com
   - Import your GitHub repository
   - Select the `frontend` folder as root directory (or set base directory)

2. **Set Environment Variable**
   - In Vercel project settings → Environment Variables
   - Add: `VITE_API_URL`
   - Value: `https://api.yourdomain.com/api` (replace with your actual API domain)
   - Apply to: Production, Preview, Development

3. **Build Settings**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install` (auto-detected)

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically detect Vite and build correctly

## Environment Variable Format

**Important**: The API URL must include `/api` at the end because all backend routes are prefixed with `/api/`.

```
VITE_API_URL=https://api.yourdomain.com/api
```

## Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. SSL certificate is automatic

## Verification

After deployment:
1. Open your Vercel URL
2. Open browser console (F12)
3. Check Network tab - API calls should go to your backend API
4. Test login functionality

## Troubleshooting

- **CORS errors**: Ensure backend `CORS_ORIGIN` includes your Vercel domain
- **API not found**: Check `VITE_API_URL` includes `/api` at the end
- **Build fails**: Check Node.js version (should be 18+)

