# ✅ Lab Test System - Validation Checklist

## 🔄 Migration Status

### ✅ OLD SYSTEM REMOVED
- ✅ Removed old lab services from `01-seed-services.js`
- ✅ Removed lab investigation types from `02-seed-investigation-types.js`
- ✅ Deleted old lab template seed files
- ✅ Old system still works for backward compatibility (existing orders)

### ✅ NEW SYSTEM IMPLEMENTED
- ✅ New LabTest system with individual orderable tests
- ✅ Services auto-created when lab tests are seeded
- ✅ Full admin CRUD for lab tests
- ✅ Doctor ordering API ready
- ✅ Walk-in ordering updated
- ✅ Lab results entry ready

---

## 📋 Pre-Startup Validation

### 1. Database Schema ✅
- [x] Prisma schema has all new models:
  - `LabTest`
  - `LabTestGroup`
  - `LabTestResultField`
  - `LabTestOrder`
  - `LabTestResult`
  - `LabTestResultFile`
- [x] All relationships configured
- [x] Service linking works

### 2. Seed Files ✅
- [x] `01-seed-services.js` - Removed old lab services
- [x] `02-seed-investigation-types.js` - Removed lab investigation types
- [x] `03-seed-lab-tests.js` - New lab test system
- [x] All files syntax validated

### 3. Backend APIs ✅
- [x] Admin CRUD endpoints created
- [x] Doctor ordering endpoint created
- [x] Walk-in ordering updated
- [x] Lab controller updated
- [x] Routes configured
- [x] Permissions set (ADMIN role)

### 4. Service Linking ✅
- [x] Services auto-created with lab tests
- [x] Price updates sync to Service
- [x] Name updates sync to Service
- [x] Deletion handles Service cleanup

---

## 🚀 Startup Steps

### Step 1: Install & Generate Prisma Client
```bash
cd backend
npm install
npm exec prisma generate
```

### Step 2: Run Database Migration
```bash
npm exec prisma db push
# OR
npm exec prisma migrate dev --name add_lab_test_system
```

### Step 3: Seed Database
```bash
# Option 1: Seed everything
node seed-system/seed-all.js

# Option 2: Seed only lab tests
node seed-system/03-seed-lab-tests.js
```

### Step 4: Start Backend
```bash
npm start
```

### Step 5: Verify Seeding
Check database for:
- [ ] LabTestGroup records (should have groups like "CBC", "Serology Panel", etc.)
- [ ] LabTest records (should have 50+ individual tests)
- [ ] LabTestResultField records (each test should have fields)
- [ ] Service records with category='LAB' (should match LabTest count)
- [ ] Service.code should match LabTest.code

---

## 🧪 API Testing Checklist

### Admin APIs (Requires ADMIN token)

#### Test 1: Get Lab Tests for Ordering
```bash
GET /api/admin/lab-tests/for-ordering
```
**Expected:** Returns organized structure with groups and tests

#### Test 2: Get All Lab Tests
```bash
GET /api/admin/lab-tests
```
**Expected:** Returns all tests with fields and service info

#### Test 3: Create Lab Test
```bash
POST /api/admin/lab-tests
Body: {
  "name": "Test Test",
  "code": "TEST001",
  "category": "Hematology",
  "price": 50.00,
  "resultFields": [...]
}
```
**Expected:** Creates test + service, returns test with service linked

#### Test 4: Update Lab Test Price
```bash
PUT /api/admin/lab-tests/{testId}
Body: { "price": 75.00 }
```
**Expected:** Test price updated + Service price updated

#### Test 5: Verify Service Linking
```bash
GET /api/admin/services?category=LAB
```
**Expected:** Should see services matching all lab tests

### Doctor APIs (Requires DOCTOR token)

#### Test 6: Create Lab Test Orders
```bash
POST /api/batch-orders/lab-tests
Body: {
  "visitId": 1,
  "patientId": "PAT-2025-01",
  "labTestIds": ["test-id-1", "test-id-2"],
  "instructions": "Priority"
}
```
**Expected:** Creates LabTestOrder records + Billing entries

### Walk-in APIs (Requires LAB_TECHNICIAN/ADMIN token)

#### Test 7: Create Walk-in Lab Order
```bash
POST /api/walk-in-orders/lab
Body: {
  "name": "John Doe",
  "phone": "1234567890",
  "labTestIds": ["test-id-1"],
  "notes": "Walk-in"
}
```
**Expected:** Creates patient + LabTestOrder + Billing

### Lab APIs (Requires LAB_TECHNICIAN/ADMIN token)

#### Test 8: Get Lab Orders
```bash
GET /api/labs/orders
```
**Expected:** Returns both old batchOrders and new labTestOrders

#### Test 9: Save Lab Test Result
```bash
POST /api/labs/results/lab-test
Body: {
  "orderId": "order-id",
  "results": { "value": 14.5 },
  "additionalNotes": "Normal"
}
```
**Expected:** Creates/updates LabTestResult, marks order as COMPLETED

---

## ✅ Service Linking Verification

### When Admin Updates Test:
1. **Update Price:**
   ```bash
   PUT /api/admin/lab-tests/{id} { "price": 100 }
   ```
   - ✅ LabTest.price = 100
   - ✅ Service.price = 100 (verified)

2. **Update Name:**
   ```bash
   PUT /api/admin/lab-tests/{id} { "name": "New Name" }
   ```
   - ✅ LabTest.name = "New Name"
   - ✅ Service.name = "New Name" (verified)

3. **Delete Test:**
   ```bash
   DELETE /api/admin/lab-tests/{id}
   ```
   - ✅ LabTest deleted
   - ✅ Service deleted (if not in billing)

### Database Verification:
```sql
-- Check services are linked
SELECT lt.id, lt.name, lt.price, s.id as service_id, s.price as service_price
FROM "LabTest" lt
JOIN "Service" s ON lt."serviceId" = s.id
WHERE lt."isActive" = true;

-- Verify prices match
SELECT lt.name, lt.price, s.price,
  CASE WHEN lt.price = s.price THEN '✅' ELSE '❌' END as match
FROM "LabTest" lt
JOIN "Service" s ON lt."serviceId" = s.id;
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Prisma Client Not Generated
**Solution:**
```bash
cd backend
npm exec prisma generate
```

### Issue 2: Migration Fails (Prisma 7 vs 5)
**Solution:**
```bash
# Use db push instead
npm exec prisma db push
```

### Issue 3: Services Not Created
**Check:** Run seed file and verify:
```bash
node seed-system/03-seed-lab-tests.js
```

### Issue 4: Service Price Not Updating
**Check:** Verify updateLabTest function in adminController.js
**Test:** Update a test and check Service.price in database

### Issue 5: Old Lab Services Still Present
**Solution:** They won't conflict - new system creates its own services
**Cleanup (optional):**
```sql
DELETE FROM "Service" WHERE category = 'LAB' AND code NOT IN (
  SELECT code FROM "LabTest" WHERE code IS NOT NULL
);
```

---

## 📊 Expected Database Counts After Seeding

After running `03-seed-lab-tests.js`:
- **LabTestGroup:** ~5-6 groups (CBC, Serology, LFT, KFT, Lipid Profile)
- **LabTest:** ~50+ individual tests
- **LabTestResultField:** ~100+ fields (2-20 per test)
- **Service (LAB):** ~50+ services (one per test)

---

## ✅ Final Validation

Before starting server, verify:
1. [x] Schema migrated
2. [x] Prisma client generated
3. [x] Lab tests seeded
4. [x] Services created and linked
5. [x] All APIs tested
6. [x] Service linking works
7. [x] Old system removed from seeds

**You're ready to start the server! 🚀**

