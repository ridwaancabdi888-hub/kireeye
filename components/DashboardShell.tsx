"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/auth";

type NavItem = readonly [label: string, href: string, icon: string];

const customerNav: NavItem[] = [
  ["Overview", "/customer", "⌂"],
  ["Bookings", "/customer/bookings", "▣"],
  ["Notifications", "/customer/notifications", "◉"],
  ["Profile & Documents", "/customer/profile", "♙"],
  ["Support", "/support", "?"],
];

const companyNav: NavItem[] = [
  ["Overview", "/company", "⌂"],
  ["Company Profile", "/company/onboarding", "▤"],
  ["Bookings", "/company/bookings", "▣"],
  ["Vehicles", "/company/vehicles", "◆"],
  ["Add Vehicle", "/company/vehicles/new", "+"],
  ["Employees", "/company/employees", "♙"],
  ["Payments", "/company/payments", "$"],
  ["Support", "/support", "?"],
];

const adminNav: NavItem[] = [
  ["Overview", "/admin", "⌂"],
  ["Approvals", "/admin/approvals", "✓"],
  ["Users", "/admin/users", "♙"],
  ["Companies", "/admin/companies", "▤"],
  ["Vehicles", "/admin/vehicles", "◆"],
  ["Bookings", "/admin/bookings", "▣"],
  ["Payments", "/admin/payments", "$"],
  ["Settings", "/admin/settings", "⚙"],
  ["Audit Logs", "/admin/audit-logs", "≡"],
];

function isActive(pathname: string, portal: string, href: string) {
  return pathname === href || (href !== `/${portal}` && pathname.startsWith(`${href}/`));
}

export function DashboardShell({ title, children }: { title: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const portal = pathname.startsWith("/admin") ? "admin" : pathname.startsWith("/company") ? "company" : "customer";
  const navigation = portal === "admin" ? adminNav : portal === "company" ? companyNav : customerNav;
  const portalLabel = portal === "admin" ? "Super Admin" : portal === "company" ? "Company" : "Customer";
  const quickLinks = portal === "admin"
    ? adminNav.slice(0, 3)
    : portal === "company"
      ? [companyNav[0], companyNav[2], companyNav[3]]
      : [customerNav[0], customerNav[1], customerNav[3]];

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
      <p className="sidebar-label">{portalLabel} Portal</p>
      <nav>{navigation.map(([label, href]) => <Link key={href} href={href} className={`side-link ${isActive(pathname, portal, href) ? "active" : ""}`}>{label}</Link>)}</nav>
      <div className="sidebar-bottom"><Link className="side-link" href="/">← Website</Link><button className="side-link signout-button" onClick={signOut}>Sign out</button></div>
    </aside>

    <main className="main">
      <header className="mobile-dashboard-header">
        <Link className="mobile-dashboard-brand" href={`/${portal}`}><span className="logo-mark">K</span><span><strong>Kireeye</strong><small>{portalLabel} Portal</small></span></Link>
        <button className="mobile-menu-button" type="button" aria-label="Open dashboard menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><span>☰</span> Menu</button>
      </header>

      <div className="row dashboard-heading"><div><p className="muted">Kireeye Dashboard</p><h1 className="dashboard-title">{title}</h1></div>{portal === "company" && <Link className="btn btn-primary" href="/company/vehicles/new">+ Ku dar gaadhi</Link>}</div>
      {children}
    </main>

    <nav className="mobile-bottom-nav" aria-label="Dashboard quick navigation">
      {quickLinks.map(([label, href, icon]) => <Link key={href} href={href} aria-current={isActive(pathname, portal, href) ? "page" : undefined}><span className="mobile-nav-icon">{icon}</span><span>{label}</span></Link>)}
      <button type="button" className={menuOpen ? "active" : ""} onClick={() => setMenuOpen(true)}><span className="mobile-nav-icon">☰</span><span>More</span></button>
    </nav>

    {menuOpen && <div className="mobile-menu-layer" role="presentation" onClick={() => setMenuOpen(false)}>
      <aside className="mobile-menu-drawer" role="dialog" aria-modal="true" aria-label={`${portalLabel} navigation`} onClick={(event) => event.stopPropagation()}>
        <div className="mobile-menu-head"><Link className="logo" href="/" onClick={() => setMenuOpen(false)}><span className="logo-mark">K</span>Kireeye</Link><button type="button" className="mobile-menu-close" aria-label="Close dashboard menu" onClick={() => setMenuOpen(false)}>×</button></div>
        <p className="sidebar-label">{portalLabel} Portal</p>
        <nav className="mobile-menu-links">{navigation.map(([label, href, icon]) => <Link key={href} href={href} onClick={() => setMenuOpen(false)} className={`mobile-drawer-link ${isActive(pathname, portal, href) ? "active" : ""}`}><span>{icon}</span><strong>{label}</strong><span>›</span></Link>)}</nav>
        <div className="mobile-menu-footer"><Link href="/" className="mobile-drawer-link" onClick={() => setMenuOpen(false)}><span>←</span><strong>Website</strong><span>›</span></Link><button type="button" className="mobile-drawer-link mobile-signout" onClick={signOut}><span>↪</span><strong>Sign out</strong><span>›</span></button></div>
      </aside>
    </div>}
  </div>;
}
