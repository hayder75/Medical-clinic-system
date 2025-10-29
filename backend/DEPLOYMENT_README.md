# Backend Deployment (VPS)

## Prerequisites on VPS
- Node.js v18+
- PostgreSQL 14+
- Nginx
- PM2

## Environment
Create `env.example` based on these keys and copy to `.env` on the VPS:
```
DATABASE_URL=postgresql://postgres:CHANGE_ME@localhost:5432/medical_clinic?schema=public
PORT=5000
NODE_ENV=production
JWT_SECRET=CHANGE_ME_STRONG_SECRET
CORS_ORIGIN=https://app.yourdomain.com
UPLOADS_DIR=uploads
```

## Setup
```
# install deps
npm install

# prisma
npx prisma validate
npx prisma generate
npx prisma migrate deploy

# optional: cleanup demo data
npm run cleanup:demo

# optional: seed demo patients
npm run seed:demo

# validate build
npm run validate

# Note: Server automatically creates uploads/ folder structure on startup
# Folders: uploads/, uploads/patient-attached-images/, uploads/dental-photos/, uploads/receipts/, uploads/patient-gallery/

# run with pm2
pm2 start server.js --name medical-api
pm2 save
```

## Nginx reverse proxy (example)
```
server {
  server_name api.yourdomain.com;
  listen 80;
  listen 443 ssl;
  # ssl_certificate ...;
  # ssl_certificate_key ...;

  location /uploads/ {
    alias /path/to/repo/backend/uploads/;
    add_header Cache-Control "public, max-age=31536000";
  }

  location / {
    proxy_pass http://127.0.0.1:5000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

## Security checklist
- PostgreSQL bound to localhost only
- UFW open 80/443 only
- Strong `JWT_SECRET`
- CORS restricted to frontend domain
- Daily DB backups off-server

## Troubleshooting
- Logs: `pm2 logs medical-api`
- Prisma issues: check `DATABASE_URL`, ensure Postgres is running
- CORS errors: verify `CORS_ORIGIN` matches frontend origin exactly
