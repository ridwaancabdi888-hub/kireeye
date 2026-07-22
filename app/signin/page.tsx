"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient, dashboardForRole } from "@/lib/auth";

export default function SigninPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");

    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error("User account lama helin.");

      const { data: roleRecord, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .limit(1)
        .maybeSingle();

      if (roleError) throw roleError;

      const role = roleRecord?.role ?? "customer";
      window.location.href = dashboardForRole(role);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Login-ku wuu fashilmay.");
    } finally {
      setLoading(false);
    }
  }

  return <main className="auth-page"><section className="auth-panel"><Link className="logo" href="/"><span className="logo-mark">K</span>Kireeye</Link><span className="eyebrow">Ku soo laabo</span><h1 className="auth-title">Soo gal account-kaaga</h1><p className="muted">Maamul bookings-kaaga, gaadiidkaaga ama marketplace-ka.</p><form className="auth-form" onSubmit={handleSubmit}><div className="field"><label>Email</label><input name="email" type="email" required placeholder="email@example.com" /></div><div className="field"><label>Password</label><input name="password" type="password" required /></div><div className="row"><label className="checkbox"><input type="checkbox" /> I xasuuso</label><Link className="text-link" href="/forgot-password">Password ma ilowday?</Link></div><button className="btn btn-primary auth-submit" disabled={loading}>{loading ? "Waa la gelayaa..." : "Soo gal"}</button>{message && <p className="form-message">{message}</p>}</form><p className="help-text">Accounts-ka waxaa sameeya maamulka. Haddii aadan account lahayn, la xiriir shirkaddaada ama maamulka Kireeye.</p></section><aside className="auth-aside"><span className="badge">Ammaan & la xaqiijiyey</span><h2>Hal account, dhammaan adeegyada Kireeye.</h2><p>Customer, company owner, shaqaale iyo admin mid walba wuxuu helayaa dashboard-ka ku habboon.</p></aside></main>;
}
