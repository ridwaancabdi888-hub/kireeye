"use client";

import { FormEvent, useEffect, useState } from "react";

type UserRow = {
  id: string;
  user_id: string;
  active: boolean;
  permissions: Record<string, boolean> | null;
  profiles: { full_name: string | null; email: string | null } | null;
};

type CreatedResult = { email: string; temporaryPassword: string };

const PERMISSIONS: { key: string; label: string }[] = [
  { key: "bookings.view", label: "View bookings" },
  { key: "bookings.manage", label: "Manage bookings" },
  { key: "vehicles.view", label: "View vehicles" },
  { key: "vehicles.manage", label: "Manage vehicles" },
  { key: "payments.view", label: "View payments" },
  { key: "employees.view", label: "View staff" },
  { key: "employees.manage", label: "Manage staff" },
  { key: "reports.view", label: "View reports" },
  { key: "company.profile.manage", label: "Edit company profile" },
];

export default function CompanyUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<CreatedResult | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/company/users");
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Could not load users.");
      setUsers(body.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setCreated(null);
    const form = new FormData(event.currentTarget);
    const permissions = PERMISSIONS.filter((p) => form.get(p.key) === "on").map((p) => p.key);
    try {
      const res = await fetch("/api/company/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.get("fullName"),
          email: form.get("email"),
          phone: form.get("phone"),
          password: form.get("password"),
          permissions,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Could not create the user.");
      setCreated({ email: body.user.email, temporaryPassword: body.temporaryPassword });
      (event.target as HTMLFormElement).reset();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the user.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(row: UserRow) {
    try {
      const res = await fetch("/api/company/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: row.user_id, active: !row.active }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Could not update the user.");
      }
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the user.");
    }
  }

  return (
    <main className="main">
      <div className="page-intro">
        <h1>Company users</h1>
        <p>
          Add staff to your company and choose what each person can do. Users you create can sign in and access only the
          areas their permissions allow. You can only manage users in your own company.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginTop: 0 }}>Add a user</h3>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field">
            <label>Full name</label>
            <input name="fullName" required placeholder="Booking agent name" />
          </div>
          <div className="field">
            <label>Email</label>
            <input name="email" type="email" required placeholder="agent@company.com" />
          </div>
          <div className="field">
            <label>Phone (optional)</label>
            <input name="phone" placeholder="+252 63 1234567" />
          </div>
          <div className="field">
            <label>Temporary password (optional)</label>
            <input name="password" type="text" placeholder="Leave blank to auto-generate" />
            <span className="help-text">Minimum 8 characters. Share it with the user for first login.</span>
          </div>
          <div className="field">
            <label>Permissions</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {PERMISSIONS.map((p) => (
                <label key={p.key} className="checkbox">
                  <input type="checkbox" name={p.key} /> {p.label}
                </label>
              ))}
            </div>
            <span className="help-text">Example — a Booking Agent needs &quot;View bookings&quot; and &quot;Manage bookings&quot; only.</span>
          </div>
          <button className="btn btn-primary auth-submit" disabled={submitting}>
            {submitting ? "Creating…" : "Add user"}
          </button>
        </form>
        {error && <p className="form-error" style={{ marginTop: 14 }}>{error}</p>}
        {created && (
          <div className="form-message" style={{ marginTop: 14 }}>
            User <strong>{created.email}</strong> created · temporary password: <strong>{created.temporaryPassword}</strong>.
            Shown once — copy it now.
          </div>
        )}
      </div>

      <h3>Your users</h3>
      {loading ? (
        <div className="skeleton" style={{ height: 120 }} />
      ) : users.length === 0 ? (
        <div className="empty-state">
          <h3>No users yet</h3>
          <p>Add your first staff member using the form above.</p>
        </div>
      ) : (
        <table className="table table-mobile">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Permissions</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td data-label="Name">{u.profiles?.full_name || "—"}</td>
                <td data-label="Email">{u.profiles?.email || "—"}</td>
                <td data-label="Permissions">{Object.keys(u.permissions || {}).length || 0} granted</td>
                <td data-label="Status">
                  <span className={`status st-${u.active ? "active" : "suspended"}`}>{u.active ? "active" : "inactive"}</span>
                </td>
                <td data-label="Action">
                  <button className="btn btn-ghost" onClick={() => toggleActive(u)}>
                    {u.active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
