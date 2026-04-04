# Setup Guide: Real OTP, New Users & Admin Approval

## What Changed

### 1. ✅ Removed All Demo Content
- Removed hardcoded demo OTP codes
- Removed the long list of demo admin accounts
- Removed "(Demo: use 1234)" messages

### 2. ✅ Changed Organization Structure
- **Old**: North Site / South Site
- **New**: Vibhags (Regions) with Shakhas (Branches)
  
**North Houston Vibhag:**
- Abhimanyu Shakha
- Kailash Shakha
- Shivshakti Shakha
- Vayu Shakha
- Sooraj Shakha
- Adisankrachariya Shakha
- Texas Hindu Campsite

**South Houston Vibhag:**
- (No subsections - items stored at Vibhag level)

### 3. ✅ Cleaned Up Admin Users
- Only 1 system admin: `system-admin@hss.org`
- No more hardcoded demo admins
- New users register and wait for admin approval

### 4. ✅ Real OTP Flow
- OTP is now **randomly generated** every time
- OTP is stored temporarily in the database (10-minute expiration)
- User receives OTP (shown on screen during development, email in production)
- User enters OTP to proceed
- New users are marked as "pending" until admin approves

### 5. ✅ Improved Item Management
- **Emoji Picker**: Beautiful grid of 40+ emoji icons
- Can choose or change item icon easily
- Visual preview of selected emoji
- Better form layout with improved labels

---

## How to Set Up & Use

### Step 1: Add the Missing Database Columns

Run this in your Supabase SQL Editor:

```sql
-- Add OTP storage columns to users table if not exists
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS otp_code TEXT,
ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMP;
```

### Step 2: Create Your Admin Account

The system comes with ONE system admin:
- **Email**: `system-admin@hss.org`
- **Password**: Use OTP (randomly generated)

**First login:**
1. Go to the app login page
2. Enter: `system-admin@hss.org`
3. OTP will be generated and shown on screen
4. Enter the OTP shown
5. You're logged in as admin

### Step 3: Adding New Users (Two Methods)

#### Method A: User Self-Registration
1. New user clicks "Register here"
2. Enters name and email
3. System generates random OTP and shows it on screen
4. User enters OTP
5. Account marked as "**pending approval**"
6. Admin gets notification in "👥 Users" section
7. Admin approves or rejects

#### Method B: Admin Creates User Directly (Future Feature)
Currently, users must self-register. Coming soon: Admin can directly invite users.

### Step 4: Admin Approves New Users

1. Logged in as admin
2. Click "👥 Users" in sidebar
3. See "⏳ Pending Approval" section
4. Click "✓ Approve" or "✕ Reject"
5. User can now log in!

### Step 5: Testing in Development

For development/testing without email:
- OTP is **displayed on screen** as: `OTP: 123456 - Check your email or use it below`
- Users can use that OTP immediately
- No need to wait for email

For production with email:
- Set up Supabase Auth with email provider OR
- Use a third-party service like SendGrid
- Email will contain: "Your OTP is: 123456"

---

##  New Item Addition Features

### Emoji Icon Selection

When adding or editing items:

1. **Default Icon**: 📦 (box)
2. **Change Icon**:
   - Click "Pick Icon" button
   - 40+ emoji options appear in grid
   - Click desired emoji
   - Icon picker closes automatically
3. **Preview**: Large emoji shown in orange box

**Available Emoji Options:**
```
📦 🎺 🪘 🎶 🎉 🥄 🍴 🧵 ⚽ 🪑 📚 ✏️ 🎓 🏃 ⛹️ 
🧘 🍳 🥘 🎂 🍕 🏆 🎁 🕯️ 💡 🔧 🧰 📺 🎮 🎥 📷 
🎤 🎧 🪕 🎼 🏮 🪔 👕 👖 👗 🧥 🎩 🧢
```

---

## Understanding the OTP Process

### What is OTP?
- **One-Time Password**: A unique 6-digit code valid for 10 minutes
- **Purpose**: Verify user's email/identity without storing passwords
- **Security**: Code is random and expires quickly

### OTP Flow Step-by-Step

```
User enters email
    ↓
System generates random OTP (000000 - 999999)
    ↓
OTP is stored in database with 10-minute expiration
    ↓
OTP is shown to user (in dev) or sent via email (in prod)
    ↓
User enters the 6-digit code
    ↓
System verifies:
  - Code matches what was stored?
  - Code not expired (< 10 minutes)?
    ↓
If valid: Login as user!
If invalid: "Invalid OTP. Please try again."
    ↓
If expired: User clicks "Resend OTP" for new code
```

### Key Points

✅ **Every login generates a NEW OTP**
✅ **OTP expires after 10 minutes**
✅ **Invalid attempts don't lock account**
✅ **User can click "Resend OTP" for new code**
✅ **Resending doesn't require new email address**

---

## Setting Up Real Email (Production)

### Option 1: Supabase Auth Email

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Email provider
3. Configure SMTP settings
4. Update app to use `supabase.auth.signInWithOtp()`

### Option 2: SendGrid Integration

1. Sign up at SendGrid.com
2. Get API key
3. Create Supabase Edge Function to call SendGrid API
4. Modify `sendOTP()` to call the function

### Option 3: Simple SMTP

Use your own email service:
- Gmail (app-specific password)
- Office 365
- Custom SMTP server

---

## Database Schema Update

Make sure your `users` table has these columns:

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT CHECK (role IN ('admin', 'user')),
  status TEXT CHECK (status IN ('pending', 'approved')),
  otp_code TEXT,               -- NEW
  otp_expires_at TIMESTAMP,    -- NEW
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Quick Troubleshooting

### "No account found with that email"
- User hasn't registered yet
- Admin needs to add them (or user self-registers)

### "Invalid OTP"
- Typo in 6-digit code
- Copied the display message instead of just the number
- OTP expired (>10 minutes) - click "Resend OTP"

### "Awaiting Admin Approval"
- User is registered but admin hasn't approved yet
- Admin goes to 👥 Users tab and clicks "✓ Approve"

### Users can't see inventory
- Make sure users are "approved" status (not "pending")
- Check database: `SELECT * FROM users WHERE email = 'user@email.com'`
- Should show `status = 'approved'` not `'pending'`

---

## Vibhag/Shakha Structure Reference

When adding items, choose:

**For North Houston Vibhag items:**
1. Vibhag/Site: "North Houston Vibhag"
2. Shakha/Section: Pick one of 7 Shakhas
3. Location: "Shelf 1, Top Row" etc.

**For South Houston Vibhag items:**
1. Vibhag/Site: "South Houston Vibhag"
2. Shakha/Section: (none available - shows "No sections available")
3. Location: Describe the storage area

---

## Next Steps

1. ✅ Update Supabase schema to add `otp_code` and `otp_expires_at` columns
2. ✅ Test with your system-admin@hss.org account
3. ✅ Register a test user
4. ✅ Approve the test user as admin
5. ✅ Test login with test user
6. ✅ Add items with new emoji picker
7. (Optional) Set up email provider for production

---

## Support Notes

- OTP shows on screen during development for easy testing
- In production, integrate real email service
- No passwords needed - OTP is the authentication method
- Each login is independent - previous OTP codes don't linger
- Users can't skip OTP - it's mandatory
