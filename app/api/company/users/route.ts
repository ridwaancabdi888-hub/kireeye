import { NextResponse } from "next/server";
import { getManagedCompany } from "@/lib/access-control";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase-server";

/**
 * Company Admin only (company_owner, or an employee with employees.manage).
 * Creates and lists users that belong to the caller's OWN company. The company
 * is always derived from the caller — never taken from the request body — so a
 * company admin can never touch another company's users (tenant isolation).
 */

const ALLOWED_PERMISSIONS = new Set([
  "bookings.view",
  "bookings.manage",
  "vehicles.view",
  "vehicles.manage",
  "payments.view",
  "employees.view",
  "employees.manage",
  "reports.view",
  "company.profile.manage",
]);

function generatePassword(): string {
  return `Kir-${Math.random().toString(36).slice(2, 8)}-${Math.random().toString(36).slice(2, 6)}`;
}

async function requireCompanyAdmin() {
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  if (!supabase || !admin) {
    return { error: NextResponse.json({ error: "Supabase configuration is missing." }, { status: 503 }) };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  // Owner path needs no permission; employee path requires employees.manage.
  const company = await getManagedCompany(admin, user.id, "employees.manage");
  if (!company) {
    return { error: NextResponse.json({ error: "You must be a company admin to manage company users." }, { status: 403 }) };
  }
  return { admin, user, company };
}

export async function GET() {
  const gate = await requireCompanyAdmin();
  if ("error" in gate) return gate.error;
  const { admin, company } = gate;

  const { data, error } = await admin
    .from("company_employees")
    .select("id,user_id,permissions,active,profiles!company_employees_user_id_fkey(full_name,email,phone)")
    .eq("company_id", company.id)
    .order("id", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users: data ?? [] });
}

export async function POST(request: Request) {
  const gate = await requireCompanyAdmin();
  if ("error" in gate) return gate.error;
  const { admin, user, company } = gate;

  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const fullName = String(body.fullName || "").trim();
    const phone = String(body.phone || "").trim() || null;
    const password = String(body.password || "").trim() || generatePassword();
    const requested: string[] = Array.isArray(body.permissions) ? body.permissions.map(String) : [];
    const permissions = requested.filter((p) => ALLOWED_PERMISSIONS.has(p));

    if (!email || !fullName) {
      return NextResponse.json({ error: "User name and email are required." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Temporary password must be at least 8 characters." }, { status: 400 });
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role: "company_employee" },
      user_metadata: { full_name: fullName, phone },
    });
    if (createError) throw createError;
    const newUser = created.user;
    if (!newUser) throw new Error("User could not be created.");

    const permissionMap = Object.fromEntries(permissions.map((p) => [p, true]));
    const { error: employeeError } = await admin.from("company_employees").upsert(
      {
        company_id: company.id, // forced to caller's company — tenant isolation
        user_id: newUser.id,
        permissions: permissionMap,
        active: true,
      },
      { onConflict: "company_id,user_id" },
    );
    if (employeeError) {
      await admin.auth.admin.deleteUser(newUser.id);
      throw employeeError;
    }

    await admin.from("audit_logs").insert({
      actor_id: user.id,
      action: "company_user.created",
      entity_type: "company_employee",
      entity_id: newUser.id,
      metadata: { company_id: company.id, email, permissions },
    });

    return NextResponse.json({
      success: true,
      user: { id: newUser.id, email },
      temporaryPassword: password,
      message: `User ${email} was added to your company.`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create the company user." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const gate = await requireCompanyAdmin();
  if ("error" in gate) return gate.error;
  const { admin, user, company } = gate;

  try {
    const body = await request.json();
    const employeeUserId = String(body.userId || "");
    if (!employeeUserId) return NextResponse.json({ error: "userId is required." }, { status: 400 });

    const updates: { active?: boolean; permissions?: Record<string, boolean> } = {};
    if (typeof body.active === "boolean") updates.active = body.active;
    if (Array.isArray(body.permissions)) {
      const permissions = body.permissions.map(String).filter((p: string) => ALLOWED_PERMISSIONS.has(p));
      updates.permissions = Object.fromEntries(permissions.map((p: string) => [p, true]));
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }

    // Scoped to the caller's company so another company's users are untouchable.
    const { error } = await admin
      .from("company_employees")
      .update(updates)
      .eq("company_id", company.id)
      .eq("user_id", employeeUserId);
    if (error) throw error;

    await admin.from("audit_logs").insert({
      actor_id: user.id,
      action: "company_user.updated",
      entity_type: "company_employee",
      entity_id: employeeUserId,
      metadata: { company_id: company.id, updates },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update the company user." },
      { status: 500 },
    );
  }
}
