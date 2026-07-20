"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { createSupabaseBrowserClient } from "@/lib/auth";

type UserItem={id:string;full_name:string;email:string|null;phone:string|null;created_at:string;user_roles:{role:string}[]};
const roles=["customer","car_owner","company_owner","company_employee","platform_admin","super_admin"];

export default function AdminUsersPage(){
  const[users,setUsers]=useState<UserItem[]>([]);const[message,setMessage]=useState("");const[query,setQuery]=useState("");
  async function load(){try{const supabase=createSupabaseBrowserClient();let request=supabase.from("profiles").select("id,full_name,email,phone,created_at,user_roles(role)").order("created_at",{ascending:false}).limit(200);if(query.trim())request=request.or(`full_name.ilike.%${query.trim()}%,email.ilike.%${query.trim()}%,phone.ilike.%${query.trim()}%`);const{data,error}=await request;if(error)throw error;setUsers((data||[]) as unknown as UserItem[])}catch(error){setMessage(error instanceof Error?error.message:"Users lama soo qaadi karin.")}}
  useEffect(()=>{load()},[]);
  async function changeRole(userId:string,role:string){try{const supabase=createSupabaseBrowserClient();const{data:{user}}=await supabase.auth.getUser();if(!user)return;const{error:deleteError}=await supabase.from("user_roles").delete().eq("user_id",userId);if(deleteError)throw deleteError;const{error}=await supabase.from("user_roles").insert({user_id:userId,role});if(error)throw error;await supabase.from("audit_logs").insert({actor_id:user.id,action:"user.role_changed",entity_type:"user",entity_id:userId,metadata:{role}});setMessage("Role-ka waa la beddelay.");load()}catch(error){setMessage(error instanceof Error?error.message:"Role-ka lama beddelin.")}}
  return <DashboardShell title="Users & Roles"><section className="card"><div className="section-head"><div><h2>Dhammaan users-ka</h2><p className="muted">Customers, owners, employees iyo admins.</p></div><div className="actions"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search user..."/><button className="btn btn-secondary" onClick={load}>Search</button></div></div>{message&&<p className="form-message">{message}</p>}<div className="table-scroll"><table className="table"><thead><tr><th>User</th><th>Phone</th><th>Current role</th><th>Joined</th><th>Change role</th></tr></thead><tbody>{users.map(item=>{const current=item.user_roles?.[0]?.role||"customer";return <tr key={item.id}><td><strong>{item.full_name}</strong><br/><span className="muted">{item.email||"—"}</span></td><td>{item.phone||"—"}</td><td><span className="badge">{current.replaceAll("_"," ")}</span></td><td>{new Date(item.created_at).toLocaleDateString()}</td><td><select value={current} onChange={e=>changeRole(item.id,e.target.value)}>{roles.map(role=><option key={role} value={role}>{role.replaceAll("_"," ")}</option>)}</select></td></tr>})}</tbody></table></div></section></DashboardShell>
}
