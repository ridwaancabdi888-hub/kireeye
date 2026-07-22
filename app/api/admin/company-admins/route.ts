import { NextResponse } from "next/server";
import { getPrimaryRole } from "@/lib/access-control";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase-server";

/**
 * Super Admin only. Creates a rental company together with its Company Admin
 * (a company_owner). This is the ONLY way a company-admin account comes into
 * existence — there is no public self-registration.
 *
 * GET  -> list companies with their admin (owner) contact, for the Super Admin.
 * POST -> create { companyName, adminEmail, adminFullName, adminPassword?, adminPhone? }.
 */

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base || "company"}-${suffix}`;
}

function generatePassword(): string {
  return `Kir-${Math.random().toString(36).slice(2, 8)}-${Math.random().toString(36).slice(2, 6)}`;
}

async function requireSuperAdmin() {
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();
  if (!supabase || !admin) {
    return { error: NextResponse.json({ error: "Supabase configuration is missing." }, { status: 503 }) };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const role = await getPrimaryRole(admin, user.id);
  if (role !== "super_admin") {
    return { error: NextResponse.json({ error: "Only the Super Admin can manage company admins." }, { status: 403 }) };
  }
  return { admin, user };
}

export async function GET() {
  const gate = await requireSuperAdmin();
  if ("error" in gate) return gate.error;
  const { admin } = gate;

  const { data, error } = await admin
    .from("companies")
    .select("id,name,status,commission_percent,created_at,owner_id,profiles!companies_owner_id_fkey(full_name,email,phone)")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ companies: data ?? [] });
}

export async function POST(request: Request) {
  const gate = await requireSuperAdmin();
  if ("error" in gate) return gate.error;
  const { admin, user } = gate;

  try {
    const body = await request.json();
    const companyName = String(body.companyName || "").trim();
    const adminEmail = String(body.adminEmail || "").trim().toLowerCase();
    const adminFullName = String(body.adminFullName || "").trim();
    const adminPhone = String(body.adminPhone || "").trim() || null;
    const adminPassword = String(body.adminPassword || "").trim() || generatePassword();

    if (!companyName || !adminEmail || !adminFullName) {
      return NextResponse.json({ error: "Company name, admin name, and admin email are required." }, { status: 400 });
    }
    if (adminPassword.length < 8) {
      return NextResponse.json({ error: "Temporary password must be at least 8 characters." }, { status: 400 });
    }

    // 1. Create the auth user. Role is set via app_metadata (service-role only),
    //    which the handle_new_user trigger reads to assign the company_owner role.
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      app_metadata: { role: "company_owner" },
      user_metadata: { full_name: adminFullName, phone: adminPhone },
    });
    if (createError) throw createError;
    const newUser = created.user;
    if (!newUser) throw new Error("Admin user could not be created.");

    // 2. Create the company owned by this admin.
    const { data: company, error: companyError } = await admin
      .from("companies")
      .insert({
        owner_id: newUser.id,
        name: companyName,
        slug: slugify(companyName),
        email: adminEmail,
        phone: adminPhone,
        status: "approved",
      })
      .select("id,name,slug")
      .single();
    if (companyError) {
      // Roll back the auth user so we don't leave an orphaned admin.
      await admin.auth.admin.deleteUser(newUser.id);
      throw companyError;
    }

    await admin.from("audit_logs").insert({
      actor_id: user.id,
      action: "company_admin.created",
      entity_type: "company",
      entity_id: company.id,
      metadata: { company_name: companyName, admin_email: adminEmail, admin_user_id: newUser.id },
    });

    return NextResponse.json({
      success: true,
      company,
      admin: { id: newUser.id, email: adminEmail },
      // Shown once so the Super Admin can hand off credentials. Not stored.
      temporaryPassword: adminPassword,
      message: `Company "${companyName}" and its admin were created.`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create the company admin." },
      { status: 500 },
    );
  }
}
