# Billing vs Reception Endpoints Comparison

## Summary
Billing officers have access to ALL reception endpoints. The system is correctly configured.

## Reception Endpoints (All Accessible to Billing)

| Endpoint | Method | Billing Access | Purpose |
|----------|--------|----------------|---------|
| `/api/reception/patients` | GET | ✅ YES | Get all patients with search/filter |
| `/api/reception/patients/:patientId/history` | GET | ✅ YES | Get patient visit history |
| `/api/reception/patients` | POST | ✅ YES | Create new patient (with card registration billing) |
| `/api/reception/activate-card` | POST | ✅ YES | Activate patient card (create 200 Birr billing) |
| `/api/reception/visits` | POST | ✅ YES | Create new visit for patient |
| `/api/reception/doctors` | GET | ✅ YES | Get list of doctors |
| `/api/reception/card-services` | GET | ✅ YES | Get card services |

## Billing-Specific Endpoints

| Endpoint | Method | Purpose | Notes |
|----------|--------|---------|-------|
| `/api/billing/register` | POST | Register patient (alternative) | Creates patient + visit + entry fee billing |
| `/api/billing/create-visit` | POST | Create visit for existing patient | Alternative to reception/visits |
| `/api/billing/visit/:visitId` | DELETE | Delete a visit | Billing-specific |
| `/api/billing/check-visit-status/:patientId` | GET | Check if patient can create visit | Billing-specific |
| `/api/billing` | POST | Create billing | Core billing function |
| `/api/billing` | GET | Get all billings | Core billing function |
| `/api/billing/dashboard-stats` | GET | Get billing statistics | Core billing function |
| `/api/billing/insurances` | GET | Get insurance companies | Core billing function |
| `/api/billing/:billingId/services` | POST | Add service to billing | Core billing function |
| `/api/billing/payments` | POST | Process payment | Core billing function |
| `/api/billing/unpaid` | GET | Get unpaid billings | Core billing function |
| `/api/billing/emergency-id` | PUT | Update emergency patient ID | Core billing function |
| `/api/billing/insurance` | GET | Get insurance billings | Core billing function |
| `/api/billing/insurance-payment` | POST | Process insurance payment | Core billing function |
| `/api/billing/emergency` | GET | Get emergency billings | Core billing function |
| `/api/billing/emergency-payment` | POST | Process emergency payment | Core billing function |

## Appointments Endpoints (All Accessible to Billing)

| Endpoint | Method | Billing Access | Purpose |
|----------|--------|----------------|---------|
| `/api/appointments` | POST | ✅ YES | Create appointment |
| `/api/appointments` | GET | ✅ YES | Get all appointments |
| `/api/appointments/doctor` | GET | ✅ YES | Get appointments by doctor |
| `/api/appointments/:id` | GET | ✅ YES | Get appointment by ID |
| `/api/appointments/:id` | PATCH | ✅ YES | Update appointment |
| `/api/appointments/:id` | DELETE | ✅ YES | Delete appointment |
| `/api/appointments/:id/send-to-doctor` | POST | ✅ YES | Convert appointment to visit |
| `/api/appointments/:id/debug` | GET | ✅ YES | Debug appointment status |

## Pre-Registration (Virtual Queue) Endpoints (All Accessible to Billing)

| Endpoint | Method | Billing Access | Purpose |
|----------|--------|----------------|---------|
| `/api/pre-registration/add` | POST | ✅ YES | Add patient to pre-registration queue |
| `/api/pre-registration/list` | GET | ✅ YES | Get pre-registration queue list |
| `/api/pre-registration/search` | GET | ✅ YES | Search pre-registration queue |
| `/api/pre-registration/process` | POST | ✅ YES | Process pre-registration entry |
| `/api/pre-registration/cancel` | POST | ✅ YES | Cancel pre-registration entry |
| `/api/pre-registration/search-patients` | GET | ✅ YES | Search patients for pre-registration |

## Frontend Pages Accessible to Billing

Based on `App.jsx` routing configuration:

| Page/Route | Billing Access | Uses Endpoint |
|------------|----------------|---------------|
| `/patient/register` | ✅ YES | `/api/billing/register` |
| `/reception/patient-registration` | ✅ YES | `/api/reception/patients` |
| `/reception/patient-management` | ✅ YES | `/api/reception/patients`, `/api/reception/activate-card` |
| `/reception/appointments` | ✅ YES | `/api/appointments/*` |
| `/reception/pre-registration` | ✅ YES | `/api/pre-registration/*` |
| `/billing` | ✅ YES | `/api/billing/*` |
| `/emergency-billing` | ✅ YES | `/api/billing/emergency*` |
| `/cash-management` | ✅ YES | `/api/cash-management/*` |

## Key Differences Between Endpoints

### Patient Registration

**Reception `/api/reception/patients` (POST):**
- Creates patient with `INACTIVE` card status
- Creates billing for card registration (300 Birr - CARD-REG service)
- Does NOT create a visit immediately
- Returns: `{ patient, billing, message }`

**Billing `/api/billing/register` (POST):**
- Creates patient with `Active` status
- Creates visit immediately
- Creates entry fee billing (ENTRY001 service) for non-emergency patients
- Returns: `{ patient, visit, billing }`

**Note:** Billing can use BOTH endpoints since they have access to reception endpoints.

### Card Activation

**Reception `/api/reception/activate-card` (POST):**
- Creates billing for card activation (200 Birr - CARD-ACT service)
- Card is activated after payment is processed
- Accessible from PatientManagement page
- ✅ Billing has access to this endpoint and the PatientManagement page

## Verification Status

✅ All reception routes include BILLING_OFFICER in roleGuard
✅ All appointment routes include BILLING_OFFICER in roleGuard  
✅ Virtual queue routes have BILLING_OFFICER at server level
✅ Frontend routes allow Billing access to all reception pages
✅ No routes found that have RECEPTIONIST but not BILLING_OFFICER

## Conclusion

**Billing officers have complete access to all reception features:**
- ✅ Can register patients (via both endpoints)
- ✅ Can view and manage patients
- ✅ Can activate patient cards
- ✅ Can create visits
- ✅ Can manage appointments
- ✅ Can handle pre-registration
- ✅ Can access all frontend pages that reception can access

**The system is correctly configured. No changes needed.**

