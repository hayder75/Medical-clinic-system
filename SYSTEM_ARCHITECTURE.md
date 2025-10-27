# Medical Clinic System - Architecture & Workflow Documentation

## Overview
This is a comprehensive medical clinic management system with patient registration, visit management, lab/radiology orders, pharmacy, billing, and administrative features.

## Technology Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens with bcrypt
- **File Upload**: Multer
- **PDF Generation**: PDFMake
- **Cron Jobs**: node-cron
- **Validation**: Zod

### Frontend
- **Framework**: React with Vite
- **Routing**: React Router
- **Styling**: Tailwind CSS
- **State Management**: Context API
- **Notifications**: React Hot Toast

---

## Database Schema Overview

### Core Models

#### User
- Represents all staff members (doctors, nurses, pharmacists, etc.)
- Fields: id, username, email, password, role, specialties, licenseNumber
- **Roles**: ADMIN, OWNER, DOCTOR, NURSE, PHARMACIST, LAB_TECHNICIAN, RADIOLOGIST, RECEPTIONIST, BILLING_OFFICER, PHARMACY_BILLING_OFFICER, etc.

#### Patient
- Patient demographics and card status
- Fields: id (PAT-YYYY-NN), name, dob, gender, type (REGULAR/VIP/EMERGENCY/INSURANCE), cardStatus
- **Card Types**: INACTIVE, ACTIVE, EXPIRED enhancements

#### Visit
- Central model for patient visits
- Fields: visitUid (VISIT-YYYYMMDD-NNNN), patientId, status, queueType, isEmergency
- **Visit Status Flow**: 
  - WAITING_FOR_TRIAGE → TRIAGED → WAITING_FOR_DOCTOR → IN_DOCTOR_QUEUE → UNDER_DOCTOR_REVIEW → [Sent to Labs/Radiology] → RETURNED_WITH_RESULTS → COMPLETED

#### VitalSign
- Patient vitals and medical history
- Contains comprehensive medical assessment fields

#### Appointment
- Scheduled appointments
- **Status**: SCHEDULED, ARRIVED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW

---

## API Endpoints by Module

### Authentication (`/api/auth`)
- `POST /login` - User login
- `POST /refresh` - Refresh token

### Patients (`/api/patients`)
- `GET /` - Get all patients
- `GET /:id` - Get patient details
- `GET /search` - Search patients
- `GET /:patientId/for-visit` - Get patient for visit

### Visits (`/api/visits`)
- `POST /` - Create new visit
- `PUT /:visitId` - Update visit
- `GET /uid/:visitUid` - Get visit by UID
- `POST /complete` - Complete visit
- `GET /patient/:patientId` - Get patient visits
- `GET /status/:status` - Get visits by status

### Doctors (`/api/doctors`)
- `GET /queue` - Get doctor's consultation queue
- `GET /results-queue` - Get results review queue
- `GET /unified-queue` - Get unified patient queue
- `GET /queue-status` - Get queue status
- `GET /patient-assignments` - Get patient assignments
- `GET /visits/:visitId` - Get visit details
- `GET /patient-history/:patientId` - Get patient history
- `GET /order-status/:visitId` - Get visit order status
- `POST /select` - Select visit to review
- `PUT /visits/:visitId` - Update visit (diagnosis)
- `POST /lab-orders` - Create lab order
- `POST /lab-orders/multiple` - Create multiple lab orders
- `POST /radiology-orders` - Create radiology order
- `POST /radiology-orders/multiple` - Create multiple radiology orders
- `POST /service-orders` - Create service order
- `POST /medication-orders` - Create medication order
- `POST /prescriptions/batch` - Create batch prescription
- `POST /complete` - Complete visit
- `POST /direct-complete` - Direct complete visit

### Nurses (`/api/nurses`)
- `POST /vitals` - Record vitals
- `POST /continuous-vitals` - Record continuous vitals
- `GET /patient-vitals/:patientId` - Get patient vitals
- `POST /assignments` - Assign doctor to patient
- `POST /assign-nurse-service` - Assign nurse service
- `POST /assign-nurse-services` - Assign multiple services
- `POST /assign-combined` - Assign doctor + nurse services
- `GET /queue` - Get patient queue
- `GET /doctors` - Get available doctors
- `GET /doctors-by-specialty` - Get doctors by specialty
- `GET /services` - Get nurse services
- `GET /nurses` - Get all nurses
- `GET /today-tasks` - Get today's tasks
- `GET /daily-tasks` - Get nurse daily tasks
- `POST /complete-service` - Complete nurse service
- `POST /administer` - Mark administered

### Billing (`/api/billing`)
- `POST /register` - Register patient
- `POST /create-visit` - Create visit for existing patient
- `DELETE /visit/:visitId` - Delete visit
- `GET /check-visit-status/:patientId` - Check visit status
- `POST /` - Create billing
- `GET /` - Get billings
- `GET /dashboard-stats` - Get dashboard stats
- `GET /insurances` - Get insurances
- `POST /:billingId/services` - Add service to billing
- `POST /payments` - Process payment
- `GET /unpaid` - Get unpaid billings
- `GET /insurance` - Get insurance billings
- `POST /insurance-payment` - Process insurance payment
- `GET /emergency` - Get emergency billings
- `POST /emergency-payment` - Process emergency payment

### Labs (`/api/labs`)
- `GET /templates` - Get lab templates
- `GET /orders` - Get lab orders
- `GET /orders/:orderId/detailed-results` - Get detailed results
- `POST /results/individual` - Save individual result
- `POST /orders/:labOrderId/send-to-doctor` - Send to doctor

### Radiology (`/api/radiologies`)
- `GET /orders` - Get radiology orders
- `POST /orders/:orderId/report` - Fill report
- `POST /batch-orders/:batchOrderId/attachment` - Upload attachment
- `POST /results` - Create radiology result
- `POST /results/:resultId/file` - Upload result file
- `GET /orders/:orderId/results` - Get radiology results

### Pharmacy (`/api/pharmacies`)
 spin
- `GET /orders` - Get pharmacy orders
- `POST /dispense` - Dispense medication
- `POST /bulk-dispense` - Bulk dispense
- `GET /inventory` - Get inventory
- `POST /inventory` - Add inventory item
- `PUT /inventory/:id` - Update inventory item
- `DELETE /inventory/:id` - Delete inventory item
- `GET /dispense-history` - Get dispense history
- `POST /register-medication` - Register medication

### Appointments (`/api/appointments`)
- `POST /` - Create appointment
- `GET /` - Get all appointments
- `GET /doctor` - Get appointments by doctor
- `GET /:id` - Get appointment by ID
- `PATCH /:id` - Update appointment
- `DELETE /:id` - Delete appointment
- `POST /:id/send-to-doctor` - Send to doctor queue

### Emergency (`/api/emergency`)
- `POST /services/add` - Add emergency service
- `GET /billing/:visitId` - Get emergency billing
- `POST /payment/acknowledge` - Acknowledge payment
- `GET /patients` - Get emergency patients
- `GET /stats` - Get emergency stats

### Cash Management (`/api/cash-management`)
- `GET /current-session` - Get current session
- `POST /add-transaction` - Add transaction
- `POST /add-deposit` - Add bank deposit
- `POST /add-expense` - Add expense
- `POST /reset-session` - Reset session (Admin only)
- `GET /history` - Get session history
- `POST /upload-receipt/:type/:id` - Upload receipt

### Reception (`/api/reception`)
- `GET /patients` - Get patients
- `GET /patients/:patientId/history` - Get patient history
- `POST /patients` - Create patient
- `POST /activate-card` - Activate patient card
- `POST /patients/:patientId/deactivate-card` - Deactivate card
- `POST /visits` - Create visit
- `GET /doctors` - Get doctors
- `GET /card-services` - Get card services

### Insurance (`/api/insurance`)
- `GET /companies` - Get insurance companies
- `GET /companies/:insuranceId/transactions` - Get transactions
- `POST /transactions` - Create transaction
- `PUT /transactions/:transactionId/status` - Update status
- `GET /companies/:insuranceId/report` - Generate report
- `GET /dashboard/stats` - Get dashboard stats

### Admin (`/api/admin`)
- `POST /users` - Create user
- `GET /users` - Get users
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user
- `PUT /users/:id/password` - Update password
- `POST /services` - Create service
- `GET /services` - Get services
- `PUT /services/:id` - Update service
- `DELETE /services/:id` - Delete service
- `GET /audit-logs` - Get audit logs
- `GET /reports/daily` - Get daily report
- `GET /reports/weekly` - Get weekly report
- `GET /reports/revenue` - Get revenue report

### Virtual Queue (`/api/pre-registration`)
- `POST /add` - Add to virtual queue
- `GET /list` - Get virtual queue
- `GET /search` - Search virtual queue
- `POST /process` - Process virtual queue
- `POST /cancel` - Cancel from queue

---

## Core Workflows

### 1. Patient Registration Workflow

**Option A: Emergency Walk-in**
1. Receptionist creates emergency visit (`POST /api/reception/visits`)
2. Visit starts with `status: WAITING_FOR_TRIAGE`, `isEmergency: true`
3. Nurse triages patient and records vitals (`POST /api/nurses/vitals`)
4. Nurse assigns doctor + services (`POST /api/nurses/assign-combined`)
5. Visit status → `WAITING_FOR_DOCTOR`

**Option B: Pre-registration**
1. Receptionist adds to virtual queue (`POST /api/pre-registration/add`)
2. When patient arrives, process queue (`POST /api/pre-registration/process`)
3. Creates visit or links to existing visit

**Option C: Appointment**
1. Doctor or Receptionist creates appointment (`POST /api/appointments`)
2. Receptionist sends to doctor queue (`POST /api/appointments/:id/send-to-doctor`)
3. Converts to visit automatically

### 2. Patient Visit Workflow

**Step 1: Triage (Nurse)**
- Record vitals: `POST /api/nurses/vitals`
- Assign doctor: `POST /api/nurses/assignments`
- Optional: Assign nurse services: `POST /api/nurses/assign-nurse-services`
- Visit status: `WAITING_FOR_TRIAGE` → `TRIAGED` → `WAITING_FOR_DOCTOR`

**Step 2: Doctor Consultation**
- Select visit from queue: `POST /api/doctors/select`
- Visit status: `WAITING_FOR_DOCTOR` → `IN_DOCTOR_QUEUE` → `UNDER_DOCTOR_REVIEW`
- Doctor can:
  - View patient history: `GET /api/doctors/patient-history/:patientId`
  - Order labs: `POST /api/doctors/lab-orders` or `POST /api/doctors/lab-orders/multiple`
  - Order radiology: `POST /api/doctors/radiology-orders` or `POST /api/doctors/radiology-orders/multiple`
  - Order services: `POST /api/doctors/service-orders`
  - Prescribe medications: `POST /api/doctors/medication-orders`
  - Save diagnosis notes: `POST /api/doctors/visits/:visitId/diagnosis-notes`

**Step 3: Lab/Radiology (If Ordered)**
- **Lab Orders**:
  - Lab tech views orders: `GET /api/labs/orders`
  - Fills template results: `POST /api/labs/results/individual`
  - Sends back to doctor: `POST /api/labs/orders/:labOrderId/send-to-doctor`
  - Visit status → `RETURNED_WITH_RESULTS` or `AWAITING_LAB_RESULTS`
  
- **Radiology Orders**:
  - Radiologist views orders: `GET /api/radiologies/orders`
  - Uploads images: `POST /api/radiologies/batch-orders/:batchOrderId/attachment`
  - Creates report: `POST /api/radiologies/orders/:orderId/report`
  - Visit status → `RETURNED_WITH_RESULTS` or `AWAITING_RADIOLOGY_RESULTS`

**Step 4: Results Review (Optional Loop)**
- Doctor reviews results in results queue
- Can order more tests or prescribe
- Return to consultation if needed

**Step 5: Complete Visit**
- Doctor completes visit: `POST /api/doctors/complete`
- Visit status → `COMPLETED`

**Step 6: Billing**
- Meditation or external billing creates invoice: `POST /api/billing`
- Process payment: `POST /api/billing/payments`
- Or process emergency payment: `POST /api/billing/emergency-payment`

**Step 7: Pharmacy (If Meds Prescribed)**
- Pharmacist views orders: `GET /api/pharmacies/orders`
- Dispenses medications: `POST /api/pharmacies/dispense` or `POST /api/pharmacanged/bulk-dispense`
- Updates inventory automatically

### 3. Nurse Services Workflow

1. Nurse assigns services during triage: `POST /api/nurses/assign-nurse-services`
2. Create `NurseServiceAssignment` records with status `PENDING`
3. Assigned nurse views tasks: `GET /api/nurses/daily-tasks`
4. Marks as completed: `POST /api/nurses/complete-service`
5. Visit status updates: `NURSE_SERVICES_ORDERED` → `NURSE_SERVICES_COMPLETED`

### 4. Continuous Infusion Workflow

1. Doctor prescribes continuous infusion medication
2. Creates `ContinuousInfusion` record with daily schedule
3. Nurse views tasks: `GET /api/nurses/today-tasks`
4. Administers dose: `POST /api/nurses/administer-task`
5. System tracks each administration in `NurseAdministration`

### 5. Emergency Billing Workflow

1. Emergency visit created with `isEmergency: true`
2. Services added incrementally: `POST /api/emergency/services/add`
3. Running total maintained
4. Final billing: `POST /api/emergency/payment/acknowledge`
5. Can update patient ID later: `PUT /api/billing/emergency-id`

### 6. Cash Management Workflow

1. Daily session starts automatically
2. Billing officer tracks: `GET /api/cash-management/current-session`
3. Receives payments: `POST /api/cash-management/add-transaction`
4. Deposits to bank: `POST /api/cash-management/add-deposit`
5. Records expenses: `POST /api/cash-management/add-expense`
6. Admin resets at end of day: `POST /api/cash-management/reset-session`

### 7. Insurance Transaction Workflow

1. Patient has insurance on profile
2. Services provided tracked: `POST /api/insurance/transactions`
3. Status: PENDING → SUBMITTED → APPROVED → COLLECTED
4. Update status: `PUT /api/insurance/transactions/:transactionId/status`
5. Generate reports: `GET /api/insurance/companies/:insuranceId/report`

---

## Role-Based Access

### Roles Overview
- **ADMIN**: Full system access
- **DOCTOR**: Patient consultation, orders, diagnosis
- **NURSE**: Triage, vitals, nurse services
- **RECEPTIONIST**: Patient registration, appointments, queue management
- **BILLING_OFFICER**: Payment processing, cash management, emergency billing
- **PHARMACY_BILLING_OFFICER**: Pharmacy payments
- **PHARMACIST**: Medication dispensing, inventory
- **LAB_TECHNICIAN**: Lab order processing
- **RADIOLOGIST**: Radiology order processing

### Middleware Protection
- All routes use `authMiddleware` for authentication
- Most routes use `roleGuard([...roles])` for authorization
- See `server.js` lines 79-105 for route configurations

---

## Frontend Pages

### Authentication
- `/login` - Login page

### Admin
- `/admin` - Admin dashboard

### Reception
- `/reception` - Reception dashboard
- `/reception/register` - Patient registration
- `/reception/patients` - Patient card management
- `/reception/appointments` - Appointments management
- `/reception/pre-registration` - Pre-registration queue
- `/reception/doctor-queue` - Doctor queue management

### Doctor
- `/doctor/dashboard` - Doctor dashboard
- `/doctor/consultation/:visitId` - Patient consultation page

### Nurse
- `/nurse` - Nurse dashboard

### Billing
- `/billing` - Billing dashboard
- `/emergency-billing` - Emergency billing
- `/cash-management` - Cash management
- `/doctor-queue` - Doctor queue management

### Pharmacy
- `/pharmacy` - Pharmacy dashboard
- `/pharmacy-billing` - Pharmacy billing dashboard

### Lab
- `/lab` - Lab dashboard
- `/lab/orders` - Lab orders

### Radiology
- `/radiology` - Radiology dashboard

### Shared
- Various gallery and shared components

---

## Key Features

### 1. Visit Status Management
Comprehensive status tracking from triage to completion with support for:
- Lab/radiology result review cycles
- Nurse service completion tracking
- Emergency queue management

### 2. Medical Orders
- **Lab Orders**: Single or multiple investigation types
- **Radiology Orders**: Single or multiple with file uploads
- **Batch Orders**: Combined lab/radiology services
- **Medication Orders**: With detailed prescription info
- **Service Orders**: Custom medical services

### 3. Nurse Service System
- Assign nurse services during triage
- Track completion status
- Daily task lists for nurses
- Continuous infusion tracking

### 4. Billing System
- Regular billing with service breakdowns
- Emergency billing with running totals
- Pharmacy billing
- Insurance claim tracking
- Daily cash management

### 5. Card Management
- Patient card activation
- Card expiry tracking
- Card-specific services

### 6. Appointment System
- Schedule appointments
- Convert to visits
- Track appointment status

### 7. Audit & Logging
- Comprehensive audit logs for all actions
- IP tracking and user agent logging

---

## Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `PORT`: Server port (default: 3000)
- `JWT_SECRET`: JWT signing secret
- `NODE_ENV`: Environment (development/production)

---

## Key Models Relationship

```
Patient
  ├── Visits (multiple)
  │   ├── VitalSigns (vitals for each visit)
  │   ├── LabOrders (lab tests ordered)
  │   ├── RadiologyOrders (radiology tests)
  │   ├── MedicationOrders (prescriptions)
  │   ├── BatchOrders (combined lab/radiology)
  │   ├── NurseServiceAssignments (nurse tasks)
  │   ├── Bills (billing records)
  │   └── DiagnosisNotes (doctor notes)
  ├── Billing[] (all bills)
  ├── Payments[] (payment records)
  ├── Appointments[] (future appointments)
  └── CardActivation[] (card history)

User
  ├── Assigned patients (visits)
  ├── Lab orders created
  ├── Audit logs
  └── Various relations based on role
```

---

## Next Steps for Development

When requesting changes, please specify:
1. **Module**: Which module (e.g., billing, nurses, pharmacy)
2. **Feature**: What specific feature to add/modify
3. **Workflow**: How it fits into existing workflow
4. **API Endpoint**: If creating new endpoints, specify method and URL
5. **Frontend**: If UI changes needed, specify which page/component

This documentation should help us communicate effectively about system modifications!

