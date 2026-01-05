# Lab and Radiology Order Flow Analysis

## ✅ Flow Overview

### 1. **Order Creation (Doctor Side)**
- Doctor creates lab/radiology orders via `/api/doctors/lab-orders` or `/api/doctors/radiology-orders`
- Orders are created with status: `UNPAID`
- A billing is automatically created with services that have category `LAB` or `RADIOLOGY`
- Visit status is updated to `SENT_TO_LAB`, `SENT_TO_RADIOLOGY`, or `SENT_TO_BOTH`

### 2. **Payment Processing (Billing Side)**
- When payment is made via `/api/billing/payments`
- The system checks if billing contains services with category `LAB` or `RADIOLOGY`
- If `isDiagnosticsBilling = true`, it updates:
  - **Batch Orders**: `UNPAID` → `QUEUED`
  - **Individual Lab Orders**: `UNPAID` → `QUEUED` (backward compatibility)
  - **Individual Radiology Orders**: `UNPAID` → `QUEUED` (backward compatibility)

### 3. **Order Queue (Lab/Radiology Side)**
- **Lab**: `/api/labs/orders` fetches orders with status: `PAID`, `QUEUED`, `IN_PROGRESS`, `COMPLETED`
- **Radiology**: `/api/radiologies/orders` fetches batch orders with status: `PAID`, `QUEUED`, `IN_PROGRESS`, `COMPLETED`
- Orders appear in the respective queues after payment

## 🔍 Code Locations

### Backend:
- **Order Creation**: `backend/src/controllers/doctorController.js`
  - `createLabOrder()` - Line 1967
  - `createMultipleLabOrders()` - Line 2125
  - `createRadiologyOrder()` - Line 2424
  - `createMultipleRadiologyOrders()` - Line 2561

- **Payment Processing**: `backend/src/controllers/billingController.js`
  - Payment handler - Line 1106-1235
  - Detects diagnostics billing by checking service category
  - Updates order status from UNPAID to QUEUED

- **Lab Queue**: `backend/src/controllers/labController.js`
  - `getOrders()` - Line 42
  - Fetches batch orders and walk-in orders with status QUEUED+

- **Radiology Queue**: `backend/src/controllers/radiologyController.js`
  - `getOrders()` - Line 20
  - Fetches batch orders with status QUEUED+

### Frontend:
- **Lab Orders Page**: `frontend/src/pages/lab/LabOrders.jsx`
  - Fetches from `/api/labs/orders`
  - Displays batch orders and walk-in orders

- **Radiology Dashboard**: `frontend/src/pages/radiology/RadiologyDashboard.jsx`
  - Uses `RadiologyOrders` component
  - Fetches from `/api/radiologies/orders`

## ⚠️ Potential Issues to Check

1. **Service Category Mismatch**
   - Verify that services linked to investigation types have correct category (`LAB` or `RADIOLOGY`)
   - Check: `InvestigationType.service.category` should match investigation category

2. **Billing Detection**
   - The payment flow checks `service.service.category === 'LAB'` or `'RADIOLOGY'`
   - This should work if services are properly linked

3. **Order Status Update**
   - Orders are updated based on `visitId` matching
   - Ensure orders have correct `visitId` when created

4. **Batch Orders vs Individual Orders**
   - System uses batch orders (new system) but also supports individual orders (backward compatibility)
   - Both should be updated on payment

## 🧪 Testing Checklist

- [ ] Create lab order from doctor side
- [ ] Verify billing is created with LAB category service
- [ ] Make payment for the billing
- [ ] Verify lab order status changes from UNPAID to QUEUED
- [ ] Check if order appears in lab queue (`/api/labs/orders`)
- [ ] Repeat for radiology orders
- [ ] Test with batch orders (multiple tests)
- [ ] Test with walk-in orders

## 📝 Notes

- The flow appears to be correctly implemented
- Orders should automatically appear in lab/radiology queues after payment
- Both batch orders and individual orders are supported
- Frontend components are set up to display orders from the API endpoints

