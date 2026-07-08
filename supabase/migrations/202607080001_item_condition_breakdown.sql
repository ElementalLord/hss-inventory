-- Store per-item condition splits so one physical group can include damaged units without changing the whole item.

ALTER TABLE items
ADD COLUMN IF NOT EXISTS condition_breakdown jsonb NOT NULL DEFAULT '[]'::jsonb;