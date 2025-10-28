# Patient Accounts - Quick Reference

## ✅ What's Been Fixed

1. **Patient Search in Create Account Modal** - Now you can search by name instead of typing patient ID
2. **Credit Accounts Showing in Table** - Credit accounts now show up even with 0 balance
3. **Daily Cash Integration** - Account deposits now count in daily cash totals
4. **Action Buttons** - Clear buttons for "Accept Payment" (credit) and "Add Deposit" (advance)

---

## 🚀 How to Use

### Creating a CREDIT Account (for patients who pay later):

1. Go to **Patient Accounts** page
2. Click **"Create Account"**
3. **Search patient** by typing their name (e.g., "John Doe")
4. Click on the patient from dropdown
5. Select **"Credit Account"** 
6. Leave deposit empty (0)
7. Submit

**Result:** Account created with 0 balance

---

### When Patient Uses CREDIT Account:

**Example:** Patient gets 5,000 ETB services, only has 2,000 cash

1. Billing officer processes payment: **2,000 ETB**
2. System shows: **Balance: -3,000 ETB** (owes money)
3. Services proceed

**Later, to clear the debt:**
1. Go to Patient Accounts
2. Find the patient (will show red balance: -3,000)
3. Click **"Accept Payment"**
4. Enter: **3,000 ETB**
5. Submit
6. Balance becomes **0 ETB** ✅

---

### Creating an ADVANCE Account (prepaid):

1. Go to **Patient Accounts** page  
2. Click **"Create Account"**
3. **Search patient** by name
4. Select **"Advance Payment"**
5. Enter deposit: **10,000 ETB**
6. Submit

**Result:** Account has 10,000 ETB balance

---

### When Patient Uses ADVANCE Account:

**Example:** Patient gets 3,000 ETB services

1. Billing officer clicks "Process Payment"
2. Enters amount: **3,000 ETB**
3. Checks **"Use patient account balance"** checkbox
4. Clicks Submit
5. **No cash needed!** System deducts from balance
6. New balance: **7,000 ETB**

---

## 📊 Daily Cash Management

### What Counts as "Money Received Today":

✅ **Cash payments** - Patient pays immediately
✅ **Account deposits** - Patient deposits advance money
✅ **Credit payments** - Patient paying partial or clearing debt

❌ **Using advance balance** - Not new money, already counted at deposit

### Example Daily Summary:
- Starting Cash: 5,000 ETB
- Cash Payments: +15,000 ETB
- Account Deposits: +10,000 ETB (patient deposited advance)
- Credit Payments: +5,000 ETB (patients clearing debts)
- **Total Received:** 30,000 ETB
- Expenses: -2,000 ETB
- **Cash in Drawer:** 28,000 ETB

---

## 🎯 Quick Answers

**Q: Do I create credit account first?**  
A: Yes! Create it BEFORE patient gets services if they want credit option.

**Q: How do they pay later?**  
A: They come back, go to Patient Accounts, click "Accept Payment" on their account, and pay what they owe.

**Q: Does advance money count in daily cash?**  
A: YES - when they DEPOSIT it counts. When they USE it, it doesn't (already counted).

**Q: Why isn't my credit account showing?**  
A: Make sure filter is set to "ALL" or "Credit Users". Even accounts with 0 balance will show now.

**Q: Can I add more money to advance account?**  
A: Yes! Click "Add Deposit" on the advance account and add more money.

---

## 📝 Summary

**CREDIT = OWES MONEY**
- Patient gets services first
- Pays later (partial or full)
- Balance goes negative when they owe

**ADVANCE = PREPAID**
- Patient deposits money first  
- Uses it for services later
- Balance goes down when used

Refresh your browser and test it now! 🎉

