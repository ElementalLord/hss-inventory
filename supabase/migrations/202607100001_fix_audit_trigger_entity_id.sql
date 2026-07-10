CREATE OR REPLACE FUNCTION public.log_app_audit_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entity_id text;
  v_before jsonb;
  v_after jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_after := to_jsonb(NEW);
    v_entity_id := COALESCE(v_after ->> 'id', v_after ->> 'tx_id');
  ELSIF TG_OP = 'UPDATE' THEN
    v_before := to_jsonb(OLD);
    v_after := to_jsonb(NEW);
    v_entity_id := COALESCE(
      v_after ->> 'id',
      v_after ->> 'tx_id',
      v_before ->> 'id',
      v_before ->> 'tx_id'
    );
  ELSE
    v_before := to_jsonb(OLD);
    v_entity_id := COALESCE(v_before ->> 'id', v_before ->> 'tx_id');
  END IF;

  INSERT INTO public.app_audit_log (
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
