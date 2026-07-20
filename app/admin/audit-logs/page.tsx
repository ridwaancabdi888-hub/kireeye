"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { createSupabaseBrowserClient } from "@/lib/auth";

type Log={id:string;action:string;entity_type:string;entity_id:string|null;metadata:Record<string,unknown>;created_at:string;profiles:{full_name:string;email:string|null}|null};

export default function AuditLogsPage(){
  const[items,setItems]=useState<Log[]>([]);const[message,setMessage]=useState("");
  async function load(){try{const supabase=createSupabaseBrowserClient();const{data,error}=await supabase.from("audit_logs").select("id,action,entity_type,entity_id,metadata,created_at,profiles!audit_logs_actor_id_fkey(full_name,email)").order("created_at",{ascending:false}).limit(300);if(error)throw error;setItems((data||[]) as unknown as Log[])}catch(error){setMessage(error instanceof Error?error.message:"Audit logs lama soo qaadi karin.")}}
  useEffect(()=>{load()},[]);
  return <DashboardShell title="Audit Logs"><section className="card"><div className="section-head"><div><h2>System activity</h2><p className="muted">Role changes, approvals, payments iyo administrative actions.</p></div><button className="btn btn-secondary" onClick={load}>Refresh</button></div>{message&&<p className="form-message">{message}</p>}<div className="table-scroll"><table className="table"><thead><tr><th>Date</th><th>Actor</th><th>Action</th><th>Entity</th><th>Metadata</th></tr></thead><tbody>{items.map(item=><tr key={item.id}><td>{new Date(item.created_at).toLocaleString()}</td><td>{item.profiles?.full_name||"System"}<br/><span className="muted">{item.profiles?.email||""}</span></td><td><strong>{item.action}</strong></td><td>{item.entity_type}<br/><span className="muted">{item.entity_id?.slice(0,8)||"—"}</span></td><td><code>{JSON.stringify(item.metadata)}</code></td></tr>)}</tbody></table></div>{!items.length&&<p className="empty-state">Activity wali ma jirto.</p>}</section></DashboardShell>
}
