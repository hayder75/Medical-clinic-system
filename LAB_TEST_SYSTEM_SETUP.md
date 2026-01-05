# Lab Test System - Setup & Testing Guide

## ✅ What Has Been Completed

### 1. Database Schema (Prisma)
- ✅ Created `LabTest` model (individual orderable tests)
- ✅ Created `LabTestGroup` model (for UI organization)
- ✅ Created `LabTestResultField` model (result entry fields)
- ✅ Created `LabTestOrder` model (orders for new system)
- ✅ Created `LabTestResult` model (results for new system)
- ✅ Updated all relationships (Service, Patient, Visit, User, BatchOrder)

### 2. Backend APIs

#### Admin APIs (`/api/admin`)
- ✅ `POST /lab-test-groups` - Create group
- ✅ `GET /lab-test-groups` - Get all groups
- ✅ `PUT /lab-test-groups/:id` - Update group
- ✅ `DELETE /lab-test-groups/:id` - Delete group
- ✅ `POST /lab-tests` - Create lab test
- ✅ `GET /lab-tests` - Get all tests
- ✅ `GET /lab-tests/for-ordering` - Get organized tests for UI
- ✅ `GET /lab-tests/:id` - Get single test
- ✅ `PUT /lab-tests/:id` - Update test (including price)
- ✅ `DELETE /lab-tests/:id` - Delete test

#### Doctor APIs (`/api/batch-orders`)
- ✅ `POST /lab-tests` - Create lab test orders for visit
  - Body: `{ visitId, patientId, labTestIds: [], instructions? }`

#### Walk-in APIs (`/api/walk-in-orders`)
- ✅ `POST /lab` - Create walk-in lab test orders
  - Body: `{ name, phone, labTestIds: [], notes? }`

#### Lab APIs (`/api/labs`)
- ✅ `GET /orders` - Get all lab orders (includes new system)
- ✅ `POST /results/lab-test` - Save lab test results
  - Body: `{ orderId, results: {}, additionalNotes? }`

### 3. Seed File
- ✅ Created `backend/seed-system/03-seed-lab-tests.js`
- ✅ Includes all tests from your document:
  - Hematology: CBC components, ESR, Blood Group, etc.
  - Urinalysis
  - Stool Examination
  - Serology: HIV, HBsAg, HCV, etc.
  - Blood Chemistry: LFT, KFT, Lipid Profile, Glucose, HbA1c
- ✅ Each test has proper result fields with units and normal ranges
- ✅ Tests are linked to Services for billing
- ✅ Groups are created for UI organization

### 4. Controllers Updated
- ✅ `adminController.js` - Full CRUD for lab tests
- ✅ `batchOrderController.js` - New lab test ordering
- ✅ `walkInOrdersController.js` - Walk-in lab test orders
- ✅ `labController.js` - Fetch orders and save results

---

## 📋 Setup Steps

### Step 1: Install Dependencies & Generate Prisma Client
```bash
cd backend
npm install
npx prisma generate
```

### Step 2: Run Database Migration
```bash
# Make sure you're using Prisma 5 (not 7)
cd backend
npm exec prisma migrate dev --name add_lab_test_system
```

**OR** if migration fails, use `db push`:
```bash
npm exec prisma db push
```

### Step 3: Seed Lab Tests
```bash
cd backend
node seed-system/03-seed-lab-tests.js
```

**OR** run all seeds:
```bash
node seed-system/seed-all.js
```

### Step 4: Start Backend
```bash
cd backend
npm start
```

---

## 🧪 Testing APIs

### Test 1: Get Lab Tests for Ordering
```bash
curl -X GET http://localhost:3000/api/admin/lab-tests/for-ordering \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```
**Expected:** Returns tests organized by category with groups

### Test 2: Create Lab Test (Admin)
```bash
curl -X POST http://localhost:3000/api/admin/lab-tests \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Test",
    "code": "TEST001",
    "category": "Hematology",
    "price": 50.00,
    "resultFields": [
      {
        "fieldName": "value",
        "label": "Result Value",
        "fieldType": "number",
        "unit": "mg/dL",
        "isRequired": true
      }
    ]
  }'
```

### Test 3: Update Lab Test Price (Admin)
```bash
curl -X PUT http://localhost:3000/api/admin/lab-tests/TEST_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 75.00
  }'
```
**Expected:** Price updated in both LabTest and Service

### Test 4: Create Lab Test Order (Doctor)
```bash
curl -X POST http://localhost:3000/api/batch-orders/lab-tests \
  -H "Authorization: Bearer YOUR_DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "visitId": 1,
    "patientId": "PAT-2025-01",
    "labTestIds": ["test-uuid-1", "test-uuid-2"],
    "instructions": "Please prioritize"
  }'
```
**Expected:** 
- Creates LabTestOrder records
- Creates/updates Billing
- Creates BillingService entries
- Links to BatchOrder

### Test 5: Create Walk-in Lab Order
```bash
curl -X POST http://localhost:3000/api/walk-in-orders/lab \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "1234567890",
    "labTestIds": ["test-uuid-1"],
    "notes": "Walk-in patient"
  }'
```

### Test 6: Get Lab Orders (Lab Technician)
```bash
curl -X GET http://localhost:3000/api/labs/orders \
  -H "Authorization: Bearer YOUR_LAB_TECH_TOKEN"
```
**Expected:** Returns both old batchOrders and new labTestOrders

### Test 7: Save Lab Test Result
```bash
curl -X POST http://localhost:3000/api/labs/results/lab-test \
  -H "Authorization: Bearer YOUR_LAB_TECH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order-uuid",
    "results": {
      "value": 14.5
    },
    "additionalNotes": "Normal result"
  }'
```

---

## ✅ Verification Checklist

### Backend
- [ ] All APIs respond without errors
- [ ] Lab tests are seeded (check database)
- [ ] Services are linked to LabTests (check Service.labTests)
- [ ] When admin updates test price, Service price updates
- [ ] When admin deletes test, Service is deleted (if not in use)
- [ ] Doctor can order lab tests
- [ ] Walk-in orders work
- [ ] Billing is created correctly
- [ ] Lab technician can see orders
- [ ] Lab technician can save results

### Database
- [ ] `LabTestGroup` table has groups
- [ ] `LabTest` table has all tests
- [ ] `LabTestResultField` has fields for each test
- [ ] `Service` table has services linked to tests
- [ ] Verify foreign key relationships work

### Service Linking
When admin updates a lab test:
- [ ] Price change → Service.price updates
- [ ] Name change → Service.name updates (if linked)
- [ ] Test deletion → Service deleted (if no billing usage)

---

## 🔗 Service Linking Explanation

### How It Works:
1. **When creating a lab test:**
   - If test has a `code`, tries to find Service with that code
   - If not found, creates new Service with same code
   - Links `LabTest.serviceId` to `Service.id`

2. **When updating lab test price:**
   - Code checks if `serviceId` exists
   - Updates `Service.price` to match `LabTest.price`

3. **When deleting lab test:**
   - Checks if Service is used in any BillingService
   - If not used, deletes the Service
   - If used, keeps Service (for historical billing records)

### Testing Service Linking:
```bash
# 1. Get a test
GET /api/admin/lab-tests

# 2. Note the serviceId

# 3. Update test price
PUT /api/admin/lab-tests/{id} { "price": 100 }

# 4. Check Service price matches
GET /api/admin/services/{serviceId}
```

---

## 🐛 Known Issues & Notes

1. **Prisma Version:** Make sure you're using Prisma 5.20.0 (not 7.x)
   - Check: `cd backend && npm exec prisma --version`
   - If it shows 7.x, run: `npm install prisma@5.20.0 @prisma/client@5.20.0`

2. **Old System Compatibility:**
   - Old `LabOrder` and `BatchOrder` still work
   - New system runs alongside old system
   - Can migrate gradually

3. **Frontend Not Updated Yet:**
   - Backend is ready
   - Frontend needs components for:
     - Admin lab test management
     - Doctor ordering UI with groups
     - Lab technician results entry

---

## 📝 Next Steps

1. ✅ **Backend Complete** - All APIs working
2. ⏳ **Frontend Components Needed:**
   - Admin: Lab Test Management page
   - Doctor: New ordering UI with expandable groups
   - Walk-in: Lab test selection
   - Lab: Results entry for new system

3. ⏳ **Testing:**
   - Test all APIs with Postman/curl
   - Verify database relationships
   - Test service linking
   - Verify billing integration

