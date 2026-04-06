-- Persistent operations features: due dates, reservations, photo galleries, check-in reports

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS due_date timestamptz;

CREATE TABLE IF NOT EXISTS item_reservations (
  id text PRIMARY KEY,
  item_id text NOT NULL,
  item_name text,
  quantity integer NOT NULL CHECK (quantity > 0),
  reserved_for date NOT NULL,
  reserved_by text NOT NULL,
  reserved_by_name text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'fulfilled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_item_reservations_item_id ON item_reservations(item_id);
CREATE INDEX IF NOT EXISTS idx_item_reservations_reserved_for ON item_reservations(reserved_for);
CREATE INDEX IF NOT EXISTS idx_item_reservations_status ON item_reservations(status);

CREATE TABLE IF NOT EXISTS item_photos (
  id text PRIMARY KEY,
  item_id text NOT NULL,
  image text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_item_photos_item_id ON item_photos(item_id);

CREATE TABLE IF NOT EXISTS checkin_reports (
  tx_id text PRIMARY KEY,
  item_name text,
  condition text NOT NULL DEFAULT 'good' CHECK (condition IN ('good', 'damaged', 'lost')),
  note text,
  reported_by text,
  reported_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checkin_reports_condition ON checkin_reports(condition);
