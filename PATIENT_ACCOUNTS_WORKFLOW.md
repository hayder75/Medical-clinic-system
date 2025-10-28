# Patient Accounts - Complete Workflow

## Overview
The patient accounts system allows two types of payment management:
1. **ADVANCE**: Prepaid account (patient deposits money upfront)
2. **CREDIT**: Postpaid account (patient pays later)

---

## Creating Accounts

### ADVANCE Account (Prepaid)
**When to create:** 
- Patient wants to prepay for future services
- Example: Patient deposits 10,000 ETB upfront

**Steps:**
1. Go to Patient Accounts page
2. Click "Create Account"
3. Search for patient by name
4. Select patient
5. Choose "Advance Payment" type
6. Enter initial deposit (e.g., 10,000 ETB)
7. Submit

**Result:**
- Balance: +10,000 ETB
- Patient can now use this money for services

### CREDIT Account (Postpaid)
**When to create:**
- Patient requests credit/payment later option
- Usually created BEFORE they get services
- Example: Patient wants to pay in installments

**Steps:**
1. Go to Patient Accounts page
2. Click "Create Account"
3. Search for patient by name
4. Select patient
5. Choose "Credit Account" type
6. Leave deposit empty (starts at 0)
7. Submit

**Result:**
- Balance: 0 ETB
- Patient can now get services and pay partially later

---

## Using ADVANCE Accounts

### During Service Payment:

1. Patient gets services worth 3,000 ETB
2. Billing officer clicks "Process Payment"
3. System shows: "Account Balance: 10,000 ETB (Advance)"
4. Billing officer:
   - Enters amount: 3,000 ETB
   - Checks "Use patient account balance"
   - Clicks "Submit"
5. System automatically:
   - Deducts 3,000 from account balance
   - New balance: 7,000 ETB
   - Status: PAID
   - **NO cash transaction needed**

**Daily Cash Report:**
- This 3,000 ETB does NOT appear in daily cash collections
- It's already accounted for when the deposit was made

---

## Using CREDIT Accounts

### Scenario 1: Full Payment
1. Patient gets services worth 5,000 ETB
2. Billing officer processes payment: 5,000 ETB
3. Balance stays at 0 ETB
4. Status: PAID

### Scenario 2: Partial Payment (Credit Used)
1. Patient gets services worth 5,000 ETB
2. Patient only has 2,000 ETB cash
3. Billing officer:
   - Accepts 2,000 ETB payment
   - Clicks "Submit"
4. System shows:
   - Balance: -3,000 ETB (patient owes 3,000)
   - Status: PARTIALLY_PAID
   - Services proceed normally

### Clearing Credit Debt:
1. Later, patient returns to pay remaining 3,000
2. Billing officer goes to Patient Accounts
3. Finds the account (will show red balance: -3,000)
4. Clicks "Accept Payment"
5. Enters: 3,000 ETB
6. Submits
7. Balance becomes 0 ETB (debt cleared)

**Daily Cash Report:**
- When accepting credit payment (2,000), it adds to daily cash
- When clearing debt (3,000), it adds to daily cash
- Both should show in "Total Money Received Today"

---

## Daily Cash Flow Integration

### What Counts as Daily Cash:

1. **Direct Cash Payments** ✅
   - Patient pays in cash immediately
   - Goes to daily total

2. **Advance Deposits** ✅ (The MONEY DEPOSIT itself)
   - When patient adds money to advance account
   - Example: Patient deposits 10,000 ETB
   - This 10,000 SHOULD count in daily cash
   - **FIX NEEDED:** We need to integrate this

3. **Using Advance Balance** ❌
   - When using prepaid money for services
   - Example: Using 3,000 from advance account
   - This does NOT count (already counted at deposit time)

4. **Credit Payments** ✅
   - When patient pays partial or clearing debt
   - Example: Accepting 2,000 ETB credit payment
   - This counts in daily cash

5. **Debt Clearance Payments** ✅
   - When patient pays remaining balance
   - Example: Paying 3,000 to clear debt
   - This counts in daily cash

---

## Issues to Fix

### Issue 1: Credit accounts not showing in table
**Problem:** When filter is set to "CREDIT" and you create a credit account, it might not appear if balance is still 0

**Solution:** 
- Change the filter to "ALL" after creating
- Or fix the API to return accounts with 0 balance for credit type

### Issue 2: Deposit money not counted in daily cash
**Problem:** When patient deposits advance money (e.g., 10,000 ETB), it should add to today's cash collection

**Solution needed:**
- Integrate account deposits into daily cash management
- Query `AccountDeposit` records created today
- Add to "Total Money Received Today"

### Issue 3: Clear balance UI missing
**Problem:** When credit balance is negative, there should be a clear "Accept Payment" button

**Current status:** Button exists but might not be visible
**Check:** The `account.balance < 0` condition should show the button

---

## Complete Example Flow

### ADVANCE Account:

**Day 1 - Setup:**
- Admin creates advance account for John
- John deposits 10,000 ETB cash
- **Daily Cash:** +10,000 ETB
- Account balance: +10,000 ETB

**Day 2 - Usage:**
- John gets lab work: 3,000 ETB
- Uses advance account balance
- **Daily Cash:** 0 ETB (no new money)
- Account balance: +7,000 ETB

### CREDIT Account:

**Day 1 - Setup:**
- Admin creates credit account for Mary
- Balance: 0 ETB
- **Daily Cash:** 0 ETB

**Day 2 - Service:**
- Mary gets treatment: 5,000 ETB
- Pays only 2,000 ETB
- **Daily Cash:** +2,000 ETB
- Account balance: -3,000 ETB (owes 3,000)

**Day 3 - Clear Debt:**
- Mary returns and pays 3,000 ETB
- **Daily Cash:** +3,000 ETB
- Account balance: 0 ETB

