"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/auth";

export default function ForgotPasswordPage(){
  const[message,setMessage]=useState("");const[loading,setLoading]=useState(false);
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setLoading(true);setMessage("");const form=new FormData(event.currentTarget);try{const supabase=createSupabaseBrowserClient();const redirectTo=`${window.location.origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`;const{error}=await supabase.auth.resetPasswordForEmail(String(form.get("email")),{redirectTo});if(error)throw error;setMessage("Link-ga password reset-ka email-kaaga ayaa loo diray.");}catch(error){setMessage(error instanceof Error?error.message:"Request-ku wuu fashilmay.");}finally{setLoading(false)}}
  return <main className="auth-page"><section className="auth-panel"><Link className="logo" href="/"><span className="logo-mark">K</span>Kireeye</Link><span className="eyebrow">Password reset</span><h1 className="auth-title">Soo celi password-ka</h1><p className="muted">Geli email-ka account-kaaga, waxaan kuu diraynaa link ammaan ah.</p><form className="auth-form" onSubmit={submit}><div className="field"><label>Email</label><input name="email" type="email" required/></div><button className="btn btn-primary" disabled={loading}>{loading?"Waa la dirayaa...":"Dir reset link"}</button>{message&&<p className="form-message">{message}</p>}</form></section><aside className="auth-aside"><span className="badge">Secure recovery</span><h2>Account-kaaga si ammaan ah dib ugu hel.</h2></aside></main>
}
