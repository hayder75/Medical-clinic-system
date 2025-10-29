# Medical Clinic System

Medical clinic management system with patient records, appointments, lab orders, pharmacy, billing, and more.

## Architecture

- **Backend**: Node.js + Express + Prisma (PostgreSQL)
- **Frontend**: React + Vite
- **Database**: PostgreSQL

## Deployment

### Backend (VPS)
**See `backend/DEPLOYMENT_README.md` for complete VPS deployment instructions.**

**Quick setup:**
1. Install Node.js, PostgreSQL, Nginx, PM2 on VPS
2. Clone repository
3. Configure `.env` (see `backend/DEPLOYMENT_README.md`)
4. Run migrations: `npx prisma migrate deploy`
5. Start with PM2: `pm2 start server.js --name medical-api`

### Frontend (Vercel)
1. Set environment variable: `VITE_API_URL=https://api.yourdomain.com/api` (include `/api`!)
2. Deploy via Vercel dashboard (connect GitHub repo)
3. Build command: `npm run build` (auto-detected)
4. Output directory: `dist` (auto-detected)
5. See `VERCEL_DEPLOYMENT.md` for detailed instructions

## Scripts

**Backend:**
- `npm run validate` - Production readiness check
- `npm run cleanup:demo` - Remove patient/financial data (demo only)
- `npm run seed:demo` - Seed clean demo patients

**Database migration:**
- Use `backup-database.js` or `export-all-data.js` to export current data
- Import to VPS database during initial setup

## Documentation

- **Backend deployment**: `backend/DEPLOYMENT_README.md` (main guide for VPS setup)
- **Deployment summary**: `DEPLOYMENT_SUMMARY.md` (quick reference)
- Production validation: `backend/scripts/validate-production.js`
- Changelog: `CHANGELOG.md`
