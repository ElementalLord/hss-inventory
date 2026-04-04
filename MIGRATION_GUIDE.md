# Migration Guide: Bhandar → Multi-Site Inventory System

## What's Changed

### 1. Database Schema Updates

#### Items Table - Changed Fields
**Old:**
```
- location (single text field)
```

**New:**
```
- siteId (TEXT) - foreign key to site
- zoneId (TEXT) - foreign key to zone within site
- locationDescription (TEXT) - exact location details
```

### 2. Site Structure

Previously, items were stored with a generic `location` field. Now they're organized hierarchically:

```
HSS Inventory System
├── North Site
│   ├── Ghosh Section
│   ├── Sharirikh Section
│   ├── Kitchen Storage
│   └── Decoration Closet
└── South Site
    ├── Main Storage
    ├── Sports Equipment
    └── Office Supplies
```

### 3. User Interface Changes

#### Inventory View
**Old:**
- Filter by category only
- Single location field

**New:**
- Filter by site and zone
- Precise location descriptions for each item
- Shows zone name and exact location details

#### Item Forms (Add/Edit)
**Old:**
```
Storage Location: [text field]
```

**New:**
```
Site Location: [dropdown - North/South]
Zone/Section: [dropdown - based on selected site]
Description of Exact Location: [text field - e.g., "Shelf 1, Top Row"]
```

#### Dashboard Improvements
- Header now shows current site and zone
- Real-time updates across all users
- No data clearing on user logout

## Breaking Changes & Migration Steps

### For Database Migration

If upgrading from the old system, run these SQL commands:

```sql
-- Add new columns to items table
ALTER TABLE items 
ADD COLUMN siteId TEXT DEFAULT 'site1',
ADD COLUMN zoneId TEXT DEFAULT 'z1',
ADD COLUMN locationDescription TEXT DEFAULT '';

-- Migrate existing location data (example mapping)
UPDATE items 
SET locationDescription = location,
    siteId = 'site1',
    zoneId = CASE category
      WHEN 'Ghosh' THEN 'z1'
      WHEN 'Sharirikh' THEN 'z2'
      WHEN 'Kitchen' THEN 'z3'
      WHEN 'Decoration' THEN 'z4'
      ELSE 'z5'
    END;

-- Make new columns non-nullable (after migration)
ALTER TABLE items 
ALTER COLUMN siteId SET NOT NULL,
ALTER COLUMN zoneId SET NOT NULL,
ALTER COLUMN locationDescription SET NOT NULL;

-- Optionally drop old location column if no longer needed
ALTER TABLE items DROP COLUMN location CASCADE;
```

### For Application Usage

1. **Admin Setup**: Admin users should add items with proper site/zone assignments
2. **Location Descriptions**: Use descriptive text like:
   - "Cabinet A, Left side"
   - "Shelf 1, Top Row"
   - "Drawer 2, Kitchen counter"
   - "Hanging rod, Back wall"

3. **Multi-User Access**: All users will see real-time updates
   - No need to log out and back in to see changes
   - Changes are synced instantly

## Key Improvements

### ✅ Data Persistence
**Before**: Transaction history was cleared on reload
**After**: All transactions are permanently saved and persist across sessions

### ✅ Real-Time Synchronization
**Before**: Users needed to refresh to see other users' changes
**After**: Changes appear instantly for all logged-in users

### ✅ Multi-Location Support
**Before**: Only one location concept (Bhandar)
**After**: Support for multiple sites and zones

### ✅ Precise Location Tracking
**Before**: Generic locations like "Ghosh Storage"
**After**: Specific descriptions like "Cabinet A, Left side, Shelf 2"

### ✅ Multi-User Workflow
**Before**: Each user had separate inventory state
**After**: Shared, synchronized inventory visible to all users

## Testing Checklist

- [ ] Admin can add items with site/zone selections
- [ ] Searching by location description works
- [ ] Site/zone filters narrow down items correctly
- [ ] Check-out/check-in transactions appear for all users
- [ ] Data persists after logout and login
- [ ] Multiple users can modify inventory simultaneously
- [ ] History shows all transactions from all users
- [ ] Overdue items tracked correctly across users

## Rollback Plan

If issues occur, you can:

1. **Restore from Supabase backup** if available
2. **Keep old location data** by not dropping the column immediately
3. **Use feature flags** to switch between old/new system temporarily

Contact admin support if you experience any issues with the migration.
