# Credit Account Payment - How It Works

## Problem You're Seeing:
- Credit account shows **+12,000 balance** (should be negative)
- This happens because the payment was added to a credit account

## How Credit Payment SHOULD Work:

### Scenario: Patient owes 5,000 ETB

**Step 1: Patient Gets Services (owes money)**
- Patient receives services: 5,000 ETB
- They pay partial: 2,000 ETB
- **Balance: -3,000 ETB** (they owe 3,000) ✅

**Step 2: Later, Patient Returns to Pay**
- Go to Patient Accounts
- Click **"Accept Payment"** button (green button)
- Enter amount: **3,000 ETB**
- Submit

**System does:**
- Takes payment: +3,000 ETB
- Adds to balance: -3,000 + 3,000 = **0 ETB** ✅
- Debt cleared!

---

## What You Need to Do:

### To Clear a Credit Debt:

1. **Find the credit account** (will have negative balance in RED)
2. Click **"Accept Payment"** button
3. Enter the amount patient is paying
4. Choose payment method (Cash/Bank)
5. Submit
6. Balance increases (gets closer to 0)

### Example:
```
Before: Balance = -5,000 ETB (owes 5,000)
Patient pays: 3,000 ETB
After: Balance = -2,000 ETB (still owes 2,000)

Patient pays again: 2,000 ETB
Final: Balance = 0 ETB (fully paid)
```

---

## Horizontal Scroll Fix:

The table now has horizontal scrolling when screen is small:
- Scroll left/right to see all columns
- Action buttons will be visible even on small screens

---

## Your Current Case (Temam Fereja):

**Problem:** Balance shows +12,000 instead of negative

**What happened:**
- This looks like deposits were made to a credit account
- Credit accounts should have negative balance when they owe money

**To fix this manually:**
1. Click on the account
2. See the transaction history
3. If balance should be negative, you can adjust it (admin feature)

---

## Quick Summary:

**CREDIT = OWES MONEY**
- Balance should be **NEGATIVE** when patient owes money
- Balance becomes **ZERO** when fully paid
- "Accept Payment" button ADDS money to their balance (reduces debt)

Refresh the page to see the horizontal scroll fix! 📱

