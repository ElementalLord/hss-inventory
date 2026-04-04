# HSS Inventory - Multi-Site Management System

A comprehensive inventory management system for Hindu Swayamsevak Sangh (HSS) locations, enabling centralized tracking of items across multiple sites with real-time synchronization.

## 🎯 Key Features

### Multi-Location Support
- **Multiple Sites**: Manage inventory across multiple HSS locations (North Site, South Site, etc.)
- **Zone/Section Organization**: Each site has designated zones (Ghosh Section, Kitchen, Decoration, etc.)
- **Precise Location Tracking**: Store exact location descriptions for each item (e.g., "Shelf 1, Top Row" or "Cabinet A, Left side")

### Real-Time Data Synchronization
- **Live Updates**: Changes made by any user are instantly visible to all other users
- **Persistent Storage**: All transactions and inventory changes are saved to Supabase
- **Multi-User Support**: Multiple users can work simultaneously without data conflicts
- **Session Preservation**: Data persists across user logins and logouts

### Key Management
- Check-out & check-in tracking for all items
- Overdue item reminders (30-day threshold)
- Transaction history with complete audit trail
- Category-based filtering and search

### User Management
- Admin approval workflow for new users
- Role-based access control (Admin vs. Member)
- OTP-based secure authentication

## 🚀 Getting Started

### Installation
```bash
npm install
npm run dev
```

### Database Setup
This system uses [Supabase](https://supabase.co) for real-time data storage. The following tables are required:

#### Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT CHECK (role IN ('admin', 'user')),
  status TEXT CHECK (status IN ('pending', 'approved')),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Items Table
```sql
CREATE TABLE items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  category TEXT NOT NULL,
  siteId TEXT NOT NULL,
  zoneId TEXT NOT NULL,
  locationDescription TEXT NOT NULL,
  image TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Transactions Table
```sql
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES items(id),
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  checked_out_by TEXT NOT NULL REFERENCES users(id),
  checked_out_by_name TEXT NOT NULL,
  check_out_time TIMESTAMP NOT NULL,
  checked_in_by TEXT REFERENCES users(id),
  checked_in_by_name TEXT,
  check_in_time TIMESTAMP,
  status TEXT CHECK (status IN ('out', 'in')),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Available Demo Accounts
- **admin@hss.org** (OTP: 123456)
- **naitik@hss.org** (OTP: 492817)
- **sameer@hss.org** (OTP: 781204)
- **ketul@hss.org** (OTP: 630915)
- **pradeep@hss.org** (OTP: 254670)

## 📋 Site & Zone Structure

### North Site
- **Ghosh Section**: Music instruments storage
- **Sharirikh Section**: Physical training equipment
- **Kitchen Storage**: Utensils and food items
- **Decoration Closet**: Banners, decorations, seasonal items

### South Site
- **Main Storage**: General inventory storage
- **Sports Equipment**: Balls, ropes, and sports gear
- **Office Supplies**: Stationery and office items

## 💡 Usage Guide

### Adding Items
1. Click "Dashboard" or "Inventory"
2. Click "+ Add Item"
3. Fill in:
   - **Item Name**: e.g., "Dhol"
   - **Quantity**: Initial stock count
   - **Category**: Select from predefined categories
   - **Site Location**: Choose the site (North/South)
   - **Zone/Section**: Select the specific zone within the site
   - **Description of Exact Location**: Precise location details

### Checking Out Items
1. Navigate to "Inventory" tab
2. Browse items filtered by site and zone
3. Click "Check Out" on desired item
4. Enter quantity
5. Confirm - transaction is recorded

### Checking In Items
1. Go to "Check In" tab
2. See all items currently checked out
3. Click "Check In" to return items
4. Confirm - marks transaction as complete

### Viewing History
1. Navigate to "History" tab
2. View complete transaction log with check-out/check-in timestamps
3. Track who checked out what and when

### Admin Functions
- **User Management**: Approve/reject new user registrations
- **Overdue Reminders**: View and manage items checked out >30 days
- **Send Reminders**: Email reminders to users with overdue items

## 🔄 Data Persistence & Real-Time Sync

### How It Works
- **Initial Load**: On startup, the app loads all users, items, and transactions from Supabase
- **Real-Time Subscriptions**: Active subscriptions to items and transactions tables
- **Live Updates**: Any changes made by any user (add, edit, checkout, checkin) immediately appear for all users
- **Offline Support**: If offline, changes are queued and synced when connection returns

### Multi-User Workflow
```
User A logs in → loads data → makes changes → changes sync to Supabase
User B sees User A's changes in real-time → updates appear instantly
User C checks out → other users see updated quantities immediately
User A logs out → User B and C continue seeing correct data
User A logs back in → sees all changes made while offline
```

### Data Preservation
✅ **Transaction history is preserved** - No data is cleared on reload
✅ **Multi-user changes are synced** - Not tied to individual user sessions
✅ **Real-time notifications** - Changes visible immediately across all users
✅ **Audit trail maintained** - Complete record of all transactions

## 🔐 Important Notes

### User Sessions
- When a user logs out, **data is NOT deleted**
- Another user logging in will see the same inventory state
- All check-outs and check-ins are recorded in the transaction history
- Logging out and back in preserves your account and access level

### Data Accuracy
- Quantities update in real-time across all users
- Location descriptions help find items quickly
- Site/zone hierarchy prevents inventory confusion across locations

## 🛠️ Technical Stack

- **Frontend**: React 19.2.0 + Vite 7.3.1
- **Backend**: Supabase (PostgreSQL + Real-time)
- **Authentication**: OTP via Deno Functions
- **Styling**: CSS-in-JS with design system variables

## 📱 Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📝 License
© 2024 Hindu Swayamsevak Sangh