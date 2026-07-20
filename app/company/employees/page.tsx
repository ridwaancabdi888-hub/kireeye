"use client";

import { FormEvent, useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { createSupabaseBrowserClient } from "@/lib/auth";

const permissionOptions = [
  "bookings.view",
  "bookings.manage",
  "vehicles.view",
  "vehicles.manage",
  "payments.view",
  "payments.manage",
  "reports.view",
  "employees.manage",
];

type Employee = {
  id: string;
  active: boolean;
  permissions: Record<string, boolean>;
  profiles: { full_name: string; email: string | null } | null;
};

export default function EmployeesPage() {
  const [companyId, setCompanyId] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: company } = await supabase.from("companies").select("id").eq("owner_id", user.id).limit(1).maybeSingle();
        if (!company) return setMessage("Marka hore company profile samee ama Admin ha kuu ansixiyo.");
        setCompanyId(company.id);

        const { data } = await supabase
          .from("company_employees")
          .select("id,active,permissions,profiles(full_name,email)")
          .eq("company_id", company.id)
          .order("id", { ascending: false });
        setEmployees((data || []) as unknown as Employee[]);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Shaqaalaha lama soo qaadi karin.");
      }
    }
    load();
  }, []);

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/company/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId,
          email: form.get("email"),
          roleName: form.get("role"),
          permissions: form.getAll("permissions"),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Invitation failed.");
      setMessage(result.message);
      event.currentTarget.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Invitation-ka lama dirin.");
    } finally {
      setLoading(false);
    }
  }

  return <DashboardShell title="Shaqaalaha & Permissions"><div className="management-grid">
    <form className="card auth-form" onSubmit={invite}>
      <h2>Ku martiqaad shaqaale</h2>
      <div className="field"><label>Email-ka shaqaalaha</label><input name="email" type="email" required placeholder="employee@example.com"/></div>
      <div className="field"><label>Role</label><select name="role"><option>Booking Agent</option><option>Vehicle Manager</option><option>Accountant</option><option>Customer Support</option><option>Branch Manager</option></select></div>
      <div><strong>Permissions</strong>{permissionOptions.map(permission => <label className="checkbox permission" key={permission}><input type="checkbox" name="permissions" value={permission}/>{permission}</label>)}</div>
      <button className="btn btn-primary" disabled={loading || !companyId}>{loading ? "Waa la dirayaa..." : "Dir invitation"}</button>
      {message && <p className="form-message">{message}</p>}
    </form>
    <section className="card"><h2>Shaqaalaha hadda</h2>{employees.length ? employees.map(employee => <div className="employee-row" key={employee.id}><div><strong>{employee.profiles?.full_name || "Invited employee"}</strong><p className="muted">{employee.profiles?.email || "Invitation pending"}</p></div><div>{Object.entries(employee.permissions || {}).filter(([,enabled]) => enabled).map(([permission]) => <span className="badge permission-badge" key={permission}>{permission}</span>)}</div><span className="badge">{employee.active ? "Active" : "Disabled"}</span></div>) : <p className="muted">Wali shaqaale lama darin.</p>}</section>
  </div></DashboardShell>;
}
