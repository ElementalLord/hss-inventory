-- Audit log for sensitive data changes and support for future backend-enforced privileged actions.

CREATE TABLE IF NOT EXISTS app_audit_log (
  id bigserial PRIMARY KEY,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  action text NOT NULL,
  actor_email text,
  actor_role text,
  before_data jsonb,
  after_data jsonb,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_audit_log_entity_type ON app_audit_log(entity_type);
CREATE INDEX IF NOT EXISTS idx_app_audit_log_entity_id ON app_audit_log(entity_id);
CREATE INDEX IF NOT EXISTS idx_app_audit_log_action ON app_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_app_audit_log_created_at ON app_audit_log(created_at DESC);

CREATE OR REPLACE FUNCTION public.log_app_audit_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_entity_id text;
  v_before jsonb;
  v_after jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_entity_id := COALESCE(NEW.id::text, NEW.tx_id::text);
    v_after := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_entity_id := COALESCE(NEW.id::text, NEW.tx_id::text, OLD.id::text, OLD.tx_id::text);
    v_before := to_jsonb(OLD);
    v_after := to_jsonb(NEW);
  ELSE
    v_entity_id := COALESCE(OLD.id::text, OLD.tx_id::text);
    v_before := to_jsonb(OLD);
  END IF;

  INSERT INTO app_audit_log (
    entity_type,
    entity_id,
    action,
    actor_email,
    actor_role,
    before_data,
    after_data,
    details
  ) VALUES (
    TG_TABLE_NAME,
    v_entity_id,
    TG_OP,
    current_setting('app.actor_email', true),
    current_setting('app.actor_role', true),
    v_before,
    v_after,
    jsonb_build_object('schema', TG_TABLE_SCHEMA)
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_users ON users;
CREATE TRIGGER trg_audit_users
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION public.log_app_audit_change();

DROP TRIGGER IF EXISTS trg_audit_items ON items;
CREATE TRIGGER trg_audit_items
AFTER INSERT OR UPDATE OR DELETE ON items
FOR EACH ROW EXECUTE FUNCTION public.log_app_audit_change();

DROP TRIGGER IF EXISTS trg_audit_transactions ON transactions;
CREATE TRIGGER trg_audit_transactions
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW EXECUTE FUNCTION public.log_app_audit_change();

DROP TRIGGER IF EXISTS trg_audit_item_reservations ON item_reservations;
CREATE TRIGGER trg_audit_item_reservations
AFTER INSERT OR UPDATE OR DELETE ON item_reservations
FOR EACH ROW EXECUTE FUNCTION public.log_app_audit_change();

DROP TRIGGER IF EXISTS trg_audit_checkin_reports ON checkin_reports;
CREATE TRIGGER trg_audit_checkin_reports
AFTER INSERT OR UPDATE OR DELETE ON checkin_reports
FOR EACH ROW EXECUTE FUNCTION public.log_app_audit_change();
