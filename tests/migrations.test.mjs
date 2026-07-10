import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migrationUrl = new URL(
  "../supabase/migrations/202607100001_fix_audit_trigger_entity_id.sql",
  import.meta.url,
);

test("audit trigger reads table-specific identifiers from JSON", async () => {
  const migration = await readFile(migrationUrl, "utf8");

  assert.match(migration, /v_after ->> 'id'/);
  assert.match(migration, /v_after ->> 'tx_id'/);
  assert.match(migration, /v_before ->> 'id'/);
  assert.match(migration, /v_before ->> 'tx_id'/);
  assert.match(migration, /SECURITY DEFINER/);
  assert.match(migration, /SET search_path = public/);
  assert.match(migration, /INSERT INTO public\.app_audit_log/);
  assert.doesNotMatch(migration, /\b(?:NEW|OLD)\.(?:id|tx_id)\b/);
});
