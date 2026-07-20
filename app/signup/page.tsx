"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/auth";

const accountTypes = [
  { value: "customer", label: "Customer" },
  { value: "company_owner", label: "Shirkad baabuur" },
  { value: "car_owner", label: "Milkiile gaadhi" },
];

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");
    const fullName = String(form.get("fullName") || "");
    const phone = String(form.get("phone") || "");
    const role = String(form.get("role") || "customer");

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { full_name: fullName, phone, role },
        },
      });

      if (error) throw error;
      setMessage("Account-ka waa la sameeyey. Hubi email-kaaga si aad u xaqiijiso.");
      event.currentTarget.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Signup-ku wuu fashilmay.");
    } finally {
      setLoading(false);
    }
  }

  return <main className="auth-page"><section className="auth-panel"><Link className="logo" href="/"><span className="logo-mark">K</span>Kireeye</Link><span className="eyebrow">Samee account cusub</span><h1 className="auth-title">Ku biir Kireeye</h1><p className="muted">Customer ahaan baabuur kireyso, ama shirkaddaada iyo gaadiidkaaga ku soo bandhig marketplace-ka.</p><form className="auth-form" onSubmit={handleSubmit}><div className="field"><label>Magaca oo dhan</label><input name="fullName" required placeholder="Magacaaga" /></div><div className="field"><label>Phone</label><input name="phone" required placeholder="+252 63..." /></div><div className="field"><label>Email</label><input name="email" type="email" required placeholder="email@example.com" /></div><div className="field"><label>Nooca account-ka</label><select name="role">{accountTypes.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}</select></div><div className="field"><label>Password</label><input name="password" type="password" minLength={8} required /></div><button className="btn btn-primary auth-submit" disabled={loading}>{loading ? "Waa la samaynayaa..." : "Samee account"}</button>{message && <p className="form-message">{message}</p>}</form><p className="muted">Account hore ma leedahay? <Link className="text-link" href="/signin">Soo gal</Link></p></section><aside className="auth-aside"><span className="badge">Kireeye Partner Network</span><h2>Ganacsiga kirada gaadiidka si nidaamsan u maamul.</h2><p>Bookings, shaqaale, lacag-bixin, permissions iyo gaadiidka oo dhan hal dashboard.</p></aside></main>;
}
