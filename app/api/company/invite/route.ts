import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const admin = createSupabaseAdminClient();
    if (!supabase || !admin) return NextResponse.json({ error: "Supabase configuration is missing." }, { status: 503 });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const companyId = String(body.companyId || "");
    const roleName = String(body.roleName || "Company Employee");
    const permissions = Array.isArray(body.permissions) ? body.permissions : [];

    if (!email || !companyId) return NextResponse.json({ error: "Email and company are required." }, { status: 400 });

    const { data: company } = await admin.from("companies").select("id,owner_id,name").eq("id", companyId).single();
    if (!company || company.owner_id !== user.id) return NextResponse.json({ error: "You cannot invite employees to this company." }, { status: 403 });

    const redirectTo = `${new URL(request.url).origin}/auth/callback`;
    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: { role: "company_employee", company_id: companyId, company_name: company.name, role_name: roleName },
    });
    if (inviteError) throw inviteError;
    if (!invited.user) throw new Error("Invitation user was not created.");

    await admin.from("user_roles").delete().eq("user_id", invited.user.id);
    const { error: roleError } = await admin.from("user_roles").insert({ user_id: invited.user.id, role: "company_employee" });
    if (roleError) throw roleError;

    const permissionMap = Object.fromEntries(permissions.map((permission: string) => [permission, true]));
    const { error: employeeError } = await admin.from("company_employees").upsert({
      company_id: companyId,
      user_id: invited.user.id,
      permissions: permissionMap,
      active: true,
    }, { onConflict: "company_id,user_id" });
    if (employeeError) throw employeeError;

    const { error: recordError } = await admin.from("employee_invitations").insert({
      company_id: companyId,
      email,
      role_name: roleName,
      permissions: permissionMap,
      invited_by: user.id,
      status: "pending",
    });
    if (recordError) throw recordError;

    await admin.from("audit_logs").insert({
      actor_id: user.id,
      action: "employee.invited",
      entity_type: "company_employee",
      entity_id: invited.user.id,
      metadata: { company_id: companyId, email, role_name: roleName, permissions },
    });

    return NextResponse.json({ success: true, message: `Invitation sent to ${email}.` });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invitation failed." }, { status: 500 });
  }
}
