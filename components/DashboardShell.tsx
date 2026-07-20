"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/auth";

const customerNav = [
  ["Overview", "/customer"],
  ["Bookings", "/customer/bookings"],
  ["Notifications", "/customer/notifications"],
  ["Profile & Documents", "/customer/profile"],
  ["Support", "/support"],
];

const companyNav = [
  ["Overview", "/company"],
  ["Company Profile", "/company/onboarding"],
  ["Bookings", "/company/bookings"],
  ["Vehicles", "/company/vehicles"],
  ["Add Vehicle", "/company/vehicles/new"],
  ["Employees", "/company/employees"],
  ["Payments", "/company/payments"],
  ["Support", "/support"],
];

const adminNav = [
  ["Overview", "/admin"],
  ["Approvals", "/admin/approvals"],
  ["Users", "/admin/users"],
  ["Companies", "/admin/companies"],
  ["Vehicles", "/admin/vehicles"],
  ["Bookings", "/admin/bookings"],
  ["Payments", "/admin/payments"],
  ["Settings", "/admin/settings"],
  ["Audit Logs", "/admin/audit-logs"],
];

export function DashboardShell({ title, children }: { title: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const portal = pathname.startsWith("/admin") ? "admin" : pathname.startsWith("/company") ? "company" : "customer";
  const navigation = portal === "admin" ? adminNav : portal === "company" ? companyNav : customerNav;

  async function signOut() {
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    } finally {
      window.location.href = "/";
    }
  }

  return <div className="dashboard">
    <aside className="sidebar">
      <Link className="logo" href="/"><span className="logo-mark">K</span>Kireeye</Link>
      <p className="sidebar-label">{portal === "admin" ? "Super Admin Portal" : portal === "company" ? "Company Portal" : "Customer Portal"}</p>
      <nav>{navigation.map(([label, href]) => <Link key={href} href={href} className={`side-link ${pathname === href || (href !== `/${portal}` && pathname.startsWith(`${href}/`)) ? "active" : ""}`}>{label}</Link>)}</nav>
      <div className="sidebar-bottom"><Link className="side-link" href="/">← Website</Link><button className="side-link signout-button" onClick={signOut}>Sign out</button></div>
    </aside>
    <main className="main">
      <div className="row dashboard-heading"><div><p className="muted">Kireeye Dashboard</p><h1 className="dashboard-title">{title}</h1></div>{portal === "company" && <Link className="btn btn-primary" href="/company/vehicles/new">+ Ku dar gaadhi</Link>}</div>
      {children}
    </main>
  </div>;
}
