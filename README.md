# Medical Clinic Management System

A comprehensive medical clinic management system built with React, Node.js, Express, PostgreSQL, and Prisma ORM.

## 🏥 Features

- **Patient Management** - Complete patient registration and records
- **Doctor Dashboard** - Patient queue, medical records, prescriptions
- **Nurse Dashboard** - Patient care, vital signs, medication administration
- **Billing System** - Invoicing, payments, insurance management
- **Pharmacy Management** - Inventory, prescriptions, dispensing
- **Lab Management** - Test orders, results, reporting
- **Radiology** - Imaging orders and results
- **Admin Panel** - User management, reports, system configuration

## 🚀 Quick Start

### Prerequisites

Before running this project, make sure you have installed:

- **Node.js** (v18 or higher)
- **Docker** and **Docker Compose**
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd Medical-clinic-system
   ```

2. **Set up environment variables**
   
   Create a `.env` file in the `backend` directory:
   ```env
   # Database Configuration
   DATABASE_URL="postgresql://postgres:password@localhost:5432/medical_clinic_db?schema=public"
   
   # JWT Configuration
   JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
   JWT_EXPIRES_IN="24h"
   
   # Server Configuration
   PORT=3000
   HOST=localhost
   NODE_ENV=development
   
   # File Upload Configuration
   UPLOAD_DIR=uploads
   MAX_FILE_SIZE=10485760
   
   # CORS Configuration
   CORS_ORIGIN=http://localhost:3001
   ```

3. **Start with Docker (Recommended)**
   ```bash
   docker compose up -d
   ```

4. **Or run locally**
   ```bash
   # Backend
   cd backend
   npm install
   npm run migrate
   npm run generate
   npm start
   
   # Frontend (in another terminal)
   cd frontend
   npm install
   npm run dev
   ```

## 🌐 Access URLs

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **Database**: localhost:5432

## 🔑 Default Test Users

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | ADMIN |
| doctor1 | doctor123 | DOCTOR |
| nurse1 | nurse123 | NURSE |
| billing1 | billing123 | BILLING_OFFICER |
| pharmacy1 | pharmacy123 | PHARMACIST |
| lab1 | lab123 | LAB_TECHNICIAN |
| radiology1 | radiology123 | RADIOLOGIST |

## 🐳 Docker Commands

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# View logs
docker compose logs -f

# Rebuild and start
docker compose up --build -d

# Reset database
docker compose down -v
docker compose up -d
```

## 🛠️ Development

### Database Management

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Open Prisma Studio
npx prisma studio

# Reset database
npx prisma db push --force-reset
```

### Project Structure

```
Medical-clinic-system/
├── backend/                 # Node.js/Express API
│   ├── src/                # Source code
│   ├── prisma/             # Database schema
│   ├── uploads/            # File uploads
│   └── Dockerfile          # Backend container
├── frontend/               # React application
│   ├── src/                # Source code
│   ├── public/             # Static assets
│   └── Dockerfile          # Frontend container
├── docker-compose.yml      # Docker services
└── README.md              # This file
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | Secret for JWT tokens | Required |
| `JWT_EXPIRES_IN` | JWT expiration time | 24h |
| `PORT` | Backend server port | 3000 |
| `HOST` | Backend server host | localhost |
| `CORS_ORIGIN` | Frontend URL for CORS | http://localhost:3001 |

### Database Schema

The system uses PostgreSQL with Prisma ORM. Key models include:

- **User** - System users (admin, doctors, nurses, etc.)
- **Patient** - Patient information and medical records
- **Visit** - Patient visits and consultations
- **Appointment** - Scheduled appointments
- **Billing** - Invoicing and payments
- **Service** - Medical services and procedures

## 📝 API Documentation

The API follows RESTful conventions:

- `POST /api/auth/login` - User authentication
- `GET /api/patients` - List patients
- `POST /api/patients` - Create patient
- `GET /api/doctors/queue` - Doctor's patient queue
- `GET /api/admin/users` - Admin user management

## 🚨 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Kill processes using ports 3000, 3001, 5432
   sudo lsof -ti:3000,3001,5432 | xargs kill -9
   ```

2. **Database connection issues**
   - Check if PostgreSQL is running
   - Verify DATABASE_URL in .env file
   - Ensure database exists

3. **Docker issues**
   ```bash
   # Clean up Docker
   docker compose down -v
   docker system prune -f
   ```

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For support, please open an issue in the GitHub repository.
