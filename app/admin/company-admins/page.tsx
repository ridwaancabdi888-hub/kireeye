"use client";

import { FormEvent, useEffect, useState } from "react";

type CompanyRow = {
  id: string;
  name: string;
  status: string | null;
  profiles: { full_name: string | null; email: string | null; phone: string | null } | null;
};

type CreatedResult = { email: string; temporaryPassword: string; companyName: string };

export default function CompanyAdminsPage() {
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<CreatedResult | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/company-admins");
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Could not load companies.");
      setCompanies(body.companies || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load companies.");
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
    try {
      const res = await fetch("/api/admin/company-admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: form.get("companyName"),
          adminFullName: form.get("adminFullName"),
          adminEmail: form.get("adminEmail"),
          adminPhone: form.get("adminPhone"),
          adminPassword: form.get("adminPassword"),
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Could not create the company admin.");
      setCreated({ email: body.admin.email, temporaryPassword: body.temporaryPassword, companyName: body.company.name });
      (event.target as HTMLFormElement).reset();
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the company admin.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="main">
      <div className="page-intro">
        <h1>Company admins</h1>
        <p>
          Create a rental company and its admin account. Company admins sign in and manage their own company&apos;s
          vehicles, bookings, and staff. This is the only way company accounts are created — there is no public sign-up.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginTop: 0 }}>Create company + admin</h3>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field">
            <label>Company name</label>
            <input name="companyName" required placeholder="Hargeysa Premium Car Rental" />
          </div>
          <div className="field">
            <label>Admin full name</label>
            <input name="adminFullName" required placeholder="Amina Yusuf" />
          </div>
          <div className="field">
            <label>Admin email</label>
            <input name="adminEmail" type="email" required placeholder="admin@company.com" />
          </div>
          <div className="field">
            <label>Admin phone (optional)</label>
            <input name="adminPhone" placeholder="+252 63 1234567" />
          </div>
          <div className="field">
            <label>Temporary password (optional)</label>
            <input name="adminPassword" type="text" placeholder="Leave blank to auto-generate" />
            <span className="help-text">Minimum 8 characters. Share it with the admin; they can change it after first login.</span>
          </div>
          <button className="btn btn-primary auth-submit" disabled={submitting}>
            {submitting ? "Creating…" : "Create company admin"}
          </button>
        </form>
        {error && <p className="form-error" style={{ marginTop: 14 }}>{error}</p>}
        {created && (
          <div className="form-message" style={{ marginTop: 14 }}>
            <strong>{created.companyName}</strong> created. Admin login: <strong>{created.email}</strong> · temporary
            password: <strong>{created.temporaryPassword}</strong>. This password is shown once — copy it now.
          </div>
        )}
      </div>

      <h3>Existing companies</h3>
      {loading ? (
        <div className="skeleton" style={{ height: 120 }} />
      ) : companies.length === 0 ? (
        <div className="empty-state">
          <h3>No companies yet</h3>
          <p>Create your first company and admin using the form above.</p>
        </div>
      ) : (
        <table className="table table-mobile">
          <thead>
            <tr>
              <th>Company</th>
              <th>Admin</th>
              <th>Email</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id}>
                <td data-label="Company">{c.name}</td>
                <td data-label="Admin">{c.profiles?.full_name || "—"}</td>
                <td data-label="Email">{c.profiles?.email || "—"}</td>
                <td data-label="Status">
                  <span className={`status st-${c.status || "pending"}`}>{c.status || "pending"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
