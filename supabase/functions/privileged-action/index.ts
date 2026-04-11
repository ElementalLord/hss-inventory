import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type PrivilegedActionRequest = {
  action: string;
  actorEmail?: string;
  actorPassword?: string;
  payload?: Record<string, unknown>;
};

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status: string;
  password_hash: string | null;
};

const SEEDED_PRIVILEGED_ACTORS: Array<UserRow> = [
  {
    id: "seed_admin",
    name: "Admin",
    email: "admin@hss.org",
    role: "admin",
    status: "approved",
    password_hash: "7676aaafb027c825bd9abab78b234070e702752f625b752e55e55b48e607e358",
  },
  {
    id: "seed_developer",
    name: "Developer",
    email: "developer",
    role: "developer",
    status: "approved",
    password_hash: "4b811bbafe9b7bfc1adc909f8416f37314a3ea38bbd7125380eac6b436d7c414",
  },
  {
    id: "seed_developer_alias",
    name: "Developer",
    email: "developer@hss.org",
    role: "developer",
    status: "approved",
    password_hash: "4b811bbafe9b7bfc1adc909f8416f37314a3ea38bbd7125380eac6b436d7c414",
  },
];

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "Content-Type": "application/json",
    ...corsHeaders,
  },
});

const normalizeEmail = (value: unknown) => String(value || "").trim().toLowerCase();

const sha256Hex = async (value: string) => {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash)).map(byte => byte.toString(16).padStart(2, "0")).join("");
};

const isPrivilegedRole = (role: string) => role === "admin" || role === "developer";

const getSupabase = () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase service credentials.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
};

const audit = async (
  client: ReturnType<typeof createClient>,
  entry: {
    entityType: string;
    entityId: string;
    action: string;
    actorEmail: string;
    actorRole: string;
    beforeData?: unknown;
    afterData?: unknown;
    details?: Record<string, unknown>;
  },
) => {
  await client.from("app_audit_log").insert({
    entity_type: entry.entityType,
    entity_id: entry.entityId,
    action: entry.action,
    actor_email: entry.actorEmail,
    actor_role: entry.actorRole,
    before_data: entry.beforeData ?? null,
    after_data: entry.afterData ?? null,
    details: entry.details ?? {},
  });
};

const requirePrivilegedActor = async (client: ReturnType<typeof createClient>, actorEmail: string, actorPassword: string) => {
  const fetchActorByEmail = async (email: string) => client
    .from("users")
    .select("id,name,email,role,status,password_hash")
    .eq("email", email)
    .maybeSingle<UserRow>();

  let { data: actor, error } = await fetchActorByEmail(actorEmail);

  if (!actor && actorEmail === "developer@hss.org") {
    const fallback = await fetchActorByEmail("developer");
    actor = fallback.data ?? null;
    error = fallback.error;
  }

  if (!actor) {
    const seededActor = SEEDED_PRIVILEGED_ACTORS.find((candidate) => candidate.email === actorEmail) ?? null;
    if (seededActor) {
      actor = seededActor;
      error = null;
    }
  }

  if (error || !actor) {
    return { error: "Unknown actor account.", status: 404 as const };
  }

  if (actor.status !== "approved") {
    return { error: "Actor account is not approved.", status: 403 as const };
  }

  if (!isPrivilegedRole(actor.role)) {
    return { error: "Actor does not have privileged access.", status: 403 as const };
  }

  if (!actor.password_hash) {
    return { error: "Actor account is missing a password hash.", status: 403 as const };
  }

  const expected = actor.password_hash;
  const actual = await sha256Hex(actorPassword);
  if (expected !== actual) {
    return { error: "Invalid actor password.", status: 401 as const };
  }

  return { actor };
};

const allowRole = (role: unknown) => role === "user" || role === "admin" || role === "developer";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let body: PrivilegedActionRequest;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const action = String(body.action || "").trim();
  const actorEmail = normalizeEmail(body.actorEmail);
  const actorPassword = String(body.actorPassword || "").trim();

  if (!action || !actorEmail || !actorPassword) {
    return json({ error: "Missing action or credentials." }, 400);
  }

  const client = getSupabase();
  const actorResult = await requirePrivilegedActor(client, actorEmail, actorPassword);
  if ("error" in actorResult) {
    return json({ error: actorResult.error }, actorResult.status);
  }

  const actor = actorResult.actor;
  const payload = body.payload ?? {};

  try {
    if (action === "update-user-role") {
      const userId = String(payload.userId || "").trim();
      const role = String(payload.role || "").trim();

      if (!userId || !allowRole(role)) {
        return json({ error: "Invalid role update request." }, 400);
      }

      const { data: targetUser, error: targetError } = await client
        .from("users")
        .select("id,name,email,role,status")
        .eq("id", userId)
        .maybeSingle();

      if (targetError || !targetUser) {
        return json({ error: "Target user not found." }, 404);
      }

      if (String(targetUser.role) === "developer" && actor.role !== "developer") {
        return json({ error: "Developer accounts cannot be modified by non-developers." }, 403);
      }

      if (role === "developer" && actor.role !== "developer") {
        return json({ error: "Only developers can assign developer role." }, 403);
      }

      const previous = targetUser;
      const { data: updated, error: updateError } = await client
        .from("users")
        .update({ role })
        .eq("id", userId)
        .select("id,name,email,role,status")
        .maybeSingle();

      if (updateError || !updated) {
        return json({ error: updateError?.message || "Unable to update role." }, 400);
      }

      await audit(client, {
        entityType: "users",
        entityId: userId,
        action: "UPDATE_ROLE",
        actorEmail: actor.email,
        actorRole: actor.role,
        beforeData: previous,
        afterData: updated,
        details: { requestedRole: role },
      });

      return json({ ok: true, user: updated });
    }

    if (action === "delete-user") {
      const userId = String(payload.userId || "").trim();
      if (!userId) {
        return json({ error: "Missing userId." }, 400);
      }

      const { data: targetUser, error: targetError } = await client
        .from("users")
        .select("id,name,email,role,status")
        .eq("id", userId)
        .maybeSingle();

      if (targetError || !targetUser) {
        return json({ error: "Target user not found." }, 404);
      }

      const { error: txError } = await client.from("transactions").delete().or(`checked_out_by.eq.${userId},checked_in_by.eq.${userId}`);
      if (txError) {
        return json({ error: txError.message || "Failed to remove related transactions." }, 400);
      }

      const { error: deleteError } = await client.from("users").delete().eq("id", userId);
      if (deleteError) {
        return json({ error: deleteError.message || "Failed to delete user." }, 400);
      }

      await audit(client, {
        entityType: "users",
        entityId: userId,
        action: "DELETE",
        actorEmail: actor.email,
        actorRole: actor.role,
        beforeData: targetUser,
        details: { cascadedTables: ["transactions"] },
      });

      return json({ ok: true });
    }

    if (action === "update-user-status") {
      const userId = String(payload.userId || "").trim();
      const status = String(payload.status || "").trim();

      if (!userId || !["approved", "rejected", "pending"].includes(status)) {
        return json({ error: "Invalid status update request." }, 400);
      }

      const { data: targetUser, error: targetError } = await client
        .from("users")
        .select("id,name,email,role,status")
        .eq("id", userId)
        .maybeSingle();

      if (targetError || !targetUser) {
        return json({ error: "Target user not found." }, 404);
      }

      if (String(targetUser.role) === "developer" && actor.role !== "developer") {
        return json({ error: "Developer accounts cannot be modified by non-developers." }, 403);
      }

      const previous = targetUser;
      const { data: updated, error: updateError } = await client
        .from("users")
        .update({ status })
        .eq("id", userId)
        .select("id,name,email,role,status")
        .maybeSingle();

      if (updateError || !updated) {
        return json({ error: updateError?.message || "Unable to update status." }, 400);
      }

      await audit(client, {
        entityType: "users",
        entityId: userId,
        action: "UPDATE_STATUS",
        actorEmail: actor.email,
        actorRole: actor.role,
        beforeData: previous,
        afterData: updated,
        details: { requestedStatus: status },
      });

      return json({ ok: true, user: updated });
    }

    if (action === "add-item") {
      const item = payload.item as Record<string, unknown> | undefined;
      if (!item) {
        return json({ error: "Missing item payload." }, 400);
      }

      const insertData = {
        id: String(item.id || "").trim(),
        name: String(item.name || "").trim(),
        quantity: Number(item.quantity || 0),
        category: String(item.category || "").trim(),
        siteId: String(item.siteId || "").trim() || null,
        zoneId: String(item.zoneId || "").trim() || null,
        location: String(item.location || "").trim() || null,
        locationDescription: String(item.locationDescription || "").trim() || null,
        condition: String(item.condition || "Good").trim(),
        image: String(item.image || "📦").trim(),
      };

      if (!insertData.id || !insertData.name) {
        return json({ error: "Invalid item payload." }, 400);
      }

      const { data: inserted, error: insertError } = await client
        .from("items")
        .insert(insertData)
        .select("*")
        .maybeSingle();

      if (insertError || !inserted) {
        return json({ error: insertError?.message || "Failed to add item." }, 400);
      }

      await audit(client, {
        entityType: "items",
        entityId: insertData.id,
        action: "INSERT",
        actorEmail: actor.email,
        actorRole: actor.role,
        afterData: inserted,
        details: { privilegedAction: action },
      });

      return json({ ok: true, item: inserted });
    }

    if (action === "edit-item") {
      const item = payload.item as Record<string, unknown> | undefined;
      if (!item) {
        return json({ error: "Missing item payload." }, 400);
      }

      const itemId = String(item.id || "").trim();
      if (!itemId) {
        return json({ error: "Missing item id." }, 400);
      }

      const { data: existing, error: existingError } = await client.from("items").select("*").eq("id", itemId).maybeSingle();
      if (existingError || !existing) {
        return json({ error: "Item not found." }, 404);
      }

      const updateData = {
        name: String(item.name || "").trim(),
        quantity: Number(item.quantity || 0),
        category: String(item.category || "").trim(),
        condition: String(item.condition || "Good").trim(),
        image: String(item.image || "📦").trim(),
        siteId: item.siteId ? String(item.siteId).trim() : null,
        zoneId: item.zoneId ? String(item.zoneId).trim() : null,
        location: item.locationDescription ? String(item.locationDescription).trim() : null,
        locationDescription: item.locationDescription ? String(item.locationDescription).trim() : null,
      };

      const { data: updated, error: updateError } = await client
        .from("items")
        .update(updateData)
        .eq("id", itemId)
        .select("*")
        .maybeSingle();

      if (updateError || !updated) {
        return json({ error: updateError?.message || "Failed to update item." }, 400);
      }

      await audit(client, {
        entityType: "items",
        entityId: itemId,
        action: "UPDATE",
        actorEmail: actor.email,
        actorRole: actor.role,
        beforeData: existing,
        afterData: updated,
        details: { privilegedAction: action },
      });

      return json({ ok: true, item: updated });
    }

    if (action === "delete-item") {
      const itemId = String(payload.itemId || "").trim();
      if (!itemId) {
        return json({ error: "Missing itemId." }, 400);
      }

      const { data: existing, error: existingError } = await client.from("items").select("*").eq("id", itemId).maybeSingle();
      if (existingError || !existing) {
        return json({ error: "Item not found." }, 404);
      }

      const { error: txError } = await client.from("transactions").delete().match({ item_id: itemId });
      if (txError) {
        return json({ error: txError.message || "Failed to remove related transactions." }, 400);
      }

      const { error: deleteError } = await client.from("items").delete().match({ id: itemId });
      if (deleteError) {
        return json({ error: deleteError.message || "Failed to delete item." }, 400);
      }

      await audit(client, {
        entityType: "items",
        entityId: itemId,
        action: "DELETE",
        actorEmail: actor.email,
        actorRole: actor.role,
        beforeData: existing,
        details: { cascadedTables: ["transactions"] },
      });

      return json({ ok: true });
    }

    if (action === "restore-items") {
      const items = Array.isArray(payload.items) ? payload.items : [];
      if (!items.length) {
        return json({ error: "Missing items payload." }, 400);
      }

      const ids = items.map((item) => String((item as Record<string, unknown>).id || "").trim()).filter(Boolean);
      if (!ids.length) {
        return json({ error: "No valid items supplied." }, 400);
      }

      const { data: existingRows, error: queryError } = await client.from("items").select("id").in("id", ids);
      if (queryError) {
        return json({ error: queryError.message || "Unable to inspect current items." }, 400);
      }

      const existingIds = new Set((existingRows || []).map((row) => row.id));
      const missing = items.filter((item) => {
        const id = String((item as Record<string, unknown>).id || "").trim();
        return id && !existingIds.has(id);
      }).map((item) => ({
        id: String((item as Record<string, unknown>).id || "").trim(),
        name: String((item as Record<string, unknown>).name || "").trim(),
        quantity: Number((item as Record<string, unknown>).quantity || 0),
        category: String((item as Record<string, unknown>).category || "").trim(),
        siteId: (item as Record<string, unknown>).siteId ? String((item as Record<string, unknown>).siteId).trim() : null,
        zoneId: (item as Record<string, unknown>).zoneId ? String((item as Record<string, unknown>).zoneId).trim() : null,
        location: (item as Record<string, unknown>).locationDescription ? String((item as Record<string, unknown>).locationDescription).trim() : null,
        locationDescription: (item as Record<string, unknown>).locationDescription ? String((item as Record<string, unknown>).locationDescription).trim() : null,
        condition: String((item as Record<string, unknown>).condition || "Good").trim(),
        image: String((item as Record<string, unknown>).image || "📦").trim(),
      }));

      if (!missing.length) {
        return json({ ok: true, restored: 0 });
      }

      const { data: inserted, error: insertError } = await client.from("items").insert(missing).select("*");
      if (insertError) {
        return json({ error: insertError.message || "Failed to restore default items." }, 400);
      }

      for (const item of inserted || []) {
        await audit(client, {
          entityType: "items",
          entityId: String((item as { id: unknown }).id || ""),
          action: "INSERT",
          actorEmail: actor.email,
          actorRole: actor.role,
          afterData: item,
          details: { privilegedAction: action },
        });
      }

      return json({ ok: true, restored: missing.length });
    }

    return json({ error: `Unsupported action: ${action}` }, 400);
  } catch (error) {
    console.error("privileged-action error:", error);
    return json({ error: "Unexpected error while processing privileged action." }, 500);
  }
});
