-- Remove deprecated additional photo subsystem and persist item condition in items table.

ALTER TABLE items
ADD COLUMN IF NOT EXISTS condition text NOT NULL DEFAULT 'Good';

ALTER TABLE items
DROP CONSTRAINT IF EXISTS items_condition_check;

ALTER TABLE items
ADD CONSTRAINT items_condition_check CHECK (
  condition IN ('Excellent', 'Good', 'Fair', 'Needs Cleaning', 'Minor Damage', 'Damaged', 'Out of Service')
);

-- Additional photos are no longer part of the product requirements.
DROP TABLE IF EXISTS item_photos;
