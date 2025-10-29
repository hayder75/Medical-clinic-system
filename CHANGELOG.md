# Changelog

## [Unreleased]
- Added backend production validation script (`backend/scripts/validate-production.js`) and npm script `npm run validate`.
- Added demo cleanup script (`backend/scripts/cleanup-demo-data.js`).
- Added demo seed script for clean patients (`backend/scripts/seed-demo-data.js`).
- Added frontend env example (`frontend/env.example`).
- Added frontend deployment README for Vercel (`frontend/README.md`).
- Added backend deployment README for VPS (`backend/DEPLOYMENT_README.md`).
- Removed dev test scripts (`test-*.js`, `verify-*.js`) from root and backend.
- Removed Render-specific deployment files (`render.yaml`, `RENDER_*.md`, `import-all-data-to-render.js`, `seed-render-*.js`).
- Removed Windows setup guides (production targets VPS/Vercel).
- Kept backup/export scripts intact for migration use.

### Notes
- Validation script checks env, Prisma, migration status, ensures uploads directory, and smoke-loads server.
- Cleanup removes patient-generated and financial data; keep masters and users.
- Demo seed inserts 2–3 clean patients with no history.
