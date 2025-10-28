# Credit System - How It Actually Works

## Understanding the Terms:

### BALANCE (in credit accounts):
- This is the **credit limit available** (like a credit card limit)
- It's NOT money you borrowed
- It's money you CAN borrow/use

### DEBT (in credit accounts):
- This is how much you've **already used** and need to pay back
- Increases when you use the credit for services

---

## Example Workflow:

### Step 1: Patient Gets Credit Account
- Admin sets credit limit: 10,000 ETB
- **Balance: 10,000** (can use up to 10,000)
- **Debt: 0** (hasn't used anything yet)

### Step 2: Patient Uses Credit for Services (500 ETB)
- Services cost: 500 ETB
- Patient clicks "Use account balance"
- System does:
  - **Balance: 9,500** (10,000 - 500 = 9,500 credit remaining)
  - **Debt: 500** (owes 500 back)
  - This 500 shows in debt column!

### Step 3: Patient Returns Money (300 ETB)
- Patient pays: 300 ETB
- Click "Return Money" button
- System does:
  - **Debt: 200** (500 - 300 = 200 still owes)
  - **Balance: 9,500** (stays same)
  - The 300 ETB goes to daily cash!

### Step 4: Patient Returns More (200 ETB)
- Patient pays remaining: 200 ETB
- Click "Return Money"
- System does:
  - **Debt: 0** (fully paid!)
  - **Balance: 9,500** (still has credit available for future use)

---

## Key Points:

1. **Balance = Credit Available** (not debt)
2. **Debt = Money Owed** (already used)
3. **Using credit decreases balance and increases debt**
4. **Returning money decreases debt**
5. **Debt can never exceed what was used**

---

## Why debt was 0 before:

Your existing patient data was created BEFORE we added the debt tracking field. That's why debt is still 0 even though they used services.

The system now works correctly for NEW transactions!

