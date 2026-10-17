"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/auth";

export default function ResetPasswordPage(){
  const[message,setMessage]=useState("");const[loading,setLoading]=useState(false);
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setLoading(true);setMessage("");const form=new FormData(event.currentTarget);const password=String(form.get("password"));const confirm=String(form.get("confirm"));if(password!==confirm){setMessage("Labada password isku mid ma aha.");setLoading(false);return}try{const supabase=createSupabaseBrowserClient();const{error}=await supabase.auth.updateUser({password});if(error)throw error;setMessage("Password-ka waa la beddelay. Waxaad hadda geli kartaa account-kaaga.");setTimeout(()=>{window.location.href="/signin"},1200)}catch(error){setMessage(error instanceof Error?error.message:"Password-ka lama beddelin.")}finally{setLoading(false)}}
  return <main className="auth-page"><section className="auth-panel"><Link className="logo" href="/"><span className="logo-mark">K</span>Kireeye</Link><span className="eyebrow">New password</span><h1 className="auth-title">Samee password cusub</h1><form className="auth-form" onSubmit={submit} aria-busy={loading}><div className="field"><label htmlFor="new-password">Password cusub</label><input id="new-password" name="password" type="password" autoComplete="new-password" minLength={8} required/></div><div className="field"><label htmlFor="confirm-password">Ku celi password-ka</label><input id="confirm-password" name="confirm" type="password" autoComplete="new-password" minLength={8} required/></div><button className="btn btn-primary" type="submit" disabled={loading}>{loading?"Waa la beddelayaa...":"Beddel password-ka"}</button>{message&&<p className="form-message" aria-live="polite" aria-atomic="true">{message}</p>}</form></section><aside className="auth-aside"><span className="badge">Secure account</span><h2>Password adag isticmaal si account-kaagu ammaan u ahaado.</h2></aside></main>
}
