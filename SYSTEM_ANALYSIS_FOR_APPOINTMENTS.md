# Medical Clinic System - Analysis for Appointment Updates

## System Overview

### Technology Stack
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL + Prisma ORM
- **Frontend**: React + Vite
- **Auth**: JWT + bcrypt

---

## System Roles & Permissions

### Available Roles (from schema.prisma)
1. **ADMIN** - Full system access
2. **OWNER** - System owner
3. **BILLING_OFFICER** - Payment processing
4. **PHARMACY_BILLING_OFFICER** - Pharmacy payments
5. **CARE_COORDINATOR** - Care coordination
6. **CMO** - Chief Medical Officer
7. **CLINICAL_RESEARCH_COORDINATOR** - Research coordination
8. **DIETITIAN** - Nutritional care
9. **DOCTOR** - Patient consultation, diagnosis, orders
10. **HOSPITAL_MANAGER** - Hospital management
11. **HR_OFFICER** - Human resources
12. **IT_SUPPORT** - IT support
13. **LAB_TECHNICIAN** - Lab order processing
14. **MEDICAL_RECORDS_OFFICER** - Records management
15. **NURSE** - Triage, vitals, nurse services
16. **PATIENT** - Patient self-service
17. **PHARMACY_OFFICER** - Pharmacy operations
18. **PHARMACIST** - Medication dispensing
19. **RADIOLOGIST** - Radiology services
20. **RECEPTIONIST** - Patient registration, appointments
21. **SECURITY_STAFF** - Security
22. **SOCIAL_WORKER** - Social services

### Appointment Access Roles
Currently allowed roles for appointments:
- **Create**: DOCTOR, RECEPTIONIST, ADMIN
- **View (Doctor)**: DOCTOR, RECEPTIONIST, ADMIN
- **View (All)**: RECEPTIONIST, ADMIN
- **Update**: DOCTOR, RECEPTIONIST, ADMIN
- **Delete**: DOCTOR, RECEPTIONIST, ADMIN
- **Send to Doctor**: RECEPTIONIST, ADMIN

---

## Appointment System Architecture

### Database Schema (Appointment Model)

```prisma
model Appointment {
  id                Int      @id @default(autoincrement())
  patientId         String
  patient           Patient  @relation(fields: [patientId], references: [id])
  doctorId          String
  doctor            User     @relation(fields: [doctorId], references: [id])
  
  // Scheduling
  appointmentDate   DateTime
  appointmentTime   String   // e.g., "09:00 AM"
  
  // Details
  type              AppointmentType @default(CONSULTATION)  // CONSULTATION or FOLLOW_UP
  status            AppointmentStatus @default(SCHEDULED)
  duration          String?  // e.g., "30 minutes"
  notes             String?
  reason            String?  // Reason for appointment
  
  // Tracking
  createdById       String
  createdBy         User     @relation("AppointmentCreator")
  lastDiagnosedBy   String?  // Track which doctor last saw this patient
  visitId           Int?     // Link to visit when converted
  
  // Audit
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([patientId])
  @@index([doctorId])
  @@index([createdById])
  @@index([appointmentDate])
  @@index([status])
}
```

### Appointment Statuses
```prisma
enum AppointmentStatus {
  SCHEDULED   // Appointment booked, waiting for patient
  ARRIVED     // Patient has arrived at reception
  IN_PROGRESS // Patient is with the doctor
  COMPLETED   // Appointment completed
  CANCELLED   // Appointment cancelled
  NO_SHOW     // Patient didn't show up
}
```

### Appointment Types
```prisma
enum AppointmentType {
  CONSULTATION  // New consultation
  FOLLOW_UP     // Follow-up visit
}
```

---

## API Endpoints (Appointments)

### Base URL: `/api/appointments`

#### 1. **Create Appointment**
- **Endpoint**: `POST /`
- **Access**: DOCTOR, RECEPTIONIST, ADMIN
- **Description**: Creates a new appointment
- **Validation**:
  - Patient must exist and have ACTIVE card status
  - Doctor must exist and have DOCTOR role
  - Checks for time conflicts (25-minute minimum gap)
  - Gets last diagnosed doctor for patient
- **Request Body**:
  ```json
  {
    "patientId": "string (required)",
    "doctorId": "string (required)",
    "appointmentDate": "string (ISO date)",
    "appointmentTime": "string (e.g., '09:00 AM')",
    "type": "CONSULTATION | FOLLOW_UP",
    "duration": "string (optional)",
    "notes": "string (optional)",
    "reason": "string (optional)"
  }
  ```
- **Response**: Appointment object with patient, doctor, createdBy details

#### 2. **Get Appointments by Doctor**
- **Endpoint**: `GET /doctor?doctorId=xxx&status=xxx&date=xxx&type=xxx`
- **Access**: DOCTOR, RECEPTIONIST, ADMIN
- **Description**: Fetches appointments for a specific doctor
- **Query Params**:
  - `doctorId` - Doctor ID (defaults to current user)
  - `status` - Filter by status
  - `date` - Filter by date (ISO format)
  - `type` - Filter by type
- **Response**: Array of appointments with patient, doctor, createdBy details

#### 3. **Get All Appointments**
- **Endpoint**: `GET /`
- **Access**: RECEPTIONIST, ADMIN
- **Description**: Fetches all appointments with filtering
- **Query Params**:
  - `status` - Filter by status
  - `doctorId` - Filter by doctor
  - `date` - Filter by date
  - `type` - Filter by type
- **Response**: Array of all appointments

#### 4. **Get Appointment by ID**
- **Endpoint**: `GET /:id`
- **Access**: DOCTOR, RECEPTIONIST, ADMIN
- **Description**: Gets detailed appointment information
- **Response**: Appointment with all related data

#### 5. **Update Appointment**
- **Endpoint**: `PATCH /:id`
- **Access**: DOCTOR, RECEPTIONIST, ADMIN
- **Description**: Updates appointment details
- **Request Body**:
  ```json
  {
    "status": "SCHEDULED | ARRIVED | IN_PROGRESS | COMPLETED | CANCELLED | NO_SHOW",
    "notes": "string",
    "appointmentDate": "string",
    "appointmentTime": "string"
  }
  ```
- **Response**: Updated appointment

#### 6. **Delete Appointment**
- **Endpoint**: `DELETE /:id`
- **Access**: DOCTOR, RECEPTIONIST, ADMIN
- **Description**: Deletes an appointment
- **Validation**: Cannot delete if already converted to visit
- **Response**: Success message

#### 7. **Send Appointment to Doctor**
- **Endpoint**: `POST /:id/send-to-doctor`
- **Access**: RECEPTIONIST, ADMIN
- **Description**: Converts appointment to visit and adds to doctor queue
- **Process**:
  1. Checks patient card status (must be ACTIVE)
  2. Generates visit UID
  3. Creates visit with status `IN_DOCTOR_QUEUE` (skips triage)
  4. Creates consultation billing for CONSULTATION type
  5. Creates/finds doctor assignment
  6. Links visit to assignment
  7. Updates appointment status to IN_PROGRESS
  8. Links appointment to visit via visitId
- **Response**: Visit, billing, assignment objects

#### 8. **Debug Appointment Status**
- **Endpoint**: `GET /:id/debug`
- **Access**: RECEPTIONIST, ADMIN, DOCTOR
- **Description**: Debug endpoint to check appointment and visit status
- **Response**: Appointment with debug information

---

## Frontend Components

### Location: `frontend/src/components/appointments/`

#### 1. **AppointmentsCalendar.jsx**
- Main calendar view component
- Features:
  - Day-by-day navigation
  - Appointment list for selected date
  - Create/Edit/Delete appointments
  - Status badges
  - Note: Uses OLD `/api/schedules` endpoint (needs update)

#### 2. **ScheduleAppointmentModal.jsx**
- Modal for scheduling appointments
- Features:
  - Step 1: Patient search (search by name, ID, phone)
  - Step 2: Appointment details (date, time, type, reason, notes)
  - Shows patient card status
  - Uses NEW `/api/appointments` endpoint (correct)
  - Validates patient card status

### Location: `frontend/src/pages/appointments/`

#### **AppointmentsPage.jsx**
- Main appointments page
- Needs to be checked for integration

---

## Key Workflows

### 1. Appointment Creation Flow
```
1. User (DOCTOR/RECEPTIONIST/ADMIN) creates appointment
2. System validates:
   - Patient exists and has ACTIVE card
   - Doctor exists and has DOCTOR role
   - No time conflicts (25-min gap)
   - Gets last diagnosed doctor
3. Appointment created with status SCHEDULED
4. Returns appointment with patient, doctor details
```

### 2. Appointment to Visit Conversion Flow
```
1. Patient arrives at reception
2. Receptionist calls "Send to Doctor" endpoint
3. System:
   - Checks card status (must be ACTIVE)
   - Creates visit with IN_DOCTOR_QUEUE status
   - Creates consultation billing (if CONSULTATION type)
   - Creates/finds doctor assignment
   - Updates appointment status to IN_PROGRESS
   - Links appointment to visit
4. Patient appears in doctor's queue
```

### 3. Appointment Status Flow
```
SCHEDULED → ARRIVED → IN_PROGRESS → COMPLETED
            ↓
          CANCELLED / NO_SHOW
```

---

## Issues & Inconsistencies Found

### Critical Issues
1. **AppointmentsCalendar.jsx** uses OLD API endpoint `/api/schedules` instead of `/api/appointments`
2. Need headache of monitoring server logs for debugging
3. Frontend components may not be fully integrated with new appointment system

### API Consistency
- Most appointment endpoints follow consistent patterns
- Good validation and error handling
- Proper role-based access control

---

## Recommendations for Updates

### Priority 1: Frontend Updates
1. Update AppointmentsCalendar to use `/api/appointments` endpoint
2. Ensure consistent error handling
3. Add better loading states
4. Improve appointment status visualization

### Priority 2: Feature Enhancements
1. Add appointment reminders
2. Add conflict resolution UI
3. Add appointment history view
4. Add doctor availability checking
5. Add patient appointment self-booking (if role allows)

### Priority 3: Backend Enhancements
1. Add appointment conflict detection at creation time
2. Add doctor availability management
3. Add appointment cancellation reasons
4. Add patient notification system
5. Add appointment rescheduling functionality

---

## File Locations Summary

### Backend
- **Routes**: `backend/src/routes/appointments.js`
- **Controller**: `backend/src/controllers/appointmentController.js`
- **Schema**: `backend/prisma/schema.prisma` (lines 298-332, 798-810)

### Frontend
- **Main Component**: `frontend/src/components/appointments/AppointmentsCalendar.jsx`
- **Modal**: `frontend/src/components/appointments/ScheduleAppointmentModal.jsx`
- **Page**: `frontend/src/pages/appointments/AppointmentsPage.jsx`

### Other Routes
All routes are in `backend/src/routes/` (30 route files total)

---

## Next Steps

1. Identify specific updates needed for appointments section
2. Plan changes with minimal disruption to existing workflows
3. Test thoroughly before deployment
4. Document any new features or changes

---

**Last Updated**: $(date)
**Analyzed By**: System Analysis Tool
