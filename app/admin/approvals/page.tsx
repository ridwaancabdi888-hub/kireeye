"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { createSupabaseBrowserClient } from "@/lib/auth";

type ApprovalItem = { id:string; type:"Company"|"Vehicle"|"Document"; name:string; owner:string; status:string };

export default function ApprovalsPage(){
  const[items,setItems]=useState<ApprovalItem[]>([]);const[message,setMessage]=useState("");
  async function load(){try{const supabase=createSupabaseBrowserClient();const[{data:companies},{data:vehicles},{data:documents}]=await Promise.all([
    supabase.from("companies").select("id,name,status,profiles!companies_owner_id_fkey(full_name)").eq("status","pending"),
    supabase.from("vehicles").select("id,name,status,profiles!vehicles_owner_id_fkey(full_name)").eq("status","pending_approval"),
    supabase.from("verification_documents").select("id,document_type,status,profiles!verification_documents_user_id_fkey(full_name)").eq("status","pending")
  ]);const combined:ApprovalItem[]=[...(companies||[]).map((x:any)=>({id:x.id,type:"Company" as const,name:x.name,owner:x.profiles?.full_name||"Owner",status:x.status})),...(vehicles||[]).map((x:any)=>({id:x.id,type:"Vehicle" as const,name:x.name,owner:x.profiles?.full_name||"Owner",status:x.status})),...(documents||[]).map((x:any)=>({id:x.id,type:"Document" as const,name:x.document_type.replaceAll("_"," "),owner:x.profiles?.full_name||"User",status:x.status}))];setItems(combined)}catch(error){setMessage(error instanceof Error?error.message:"Approvals lama soo qaadi karin.")}}
  useEffect(()=>{load()},[]);
  async function review(item:ApprovalItem,approved:boolean){try{const supabase=createSupabaseBrowserClient();const{data:{user}}=await supabase.auth.getUser();if(!user)return;const table=item.type==="Company"?"companies":item.type==="Vehicle"?"vehicles":"verification_documents";const status=item.type==="Vehicle"?(approved?"available":"rejected"):(approved?"approved":"rejected");const payload:any={status};if(item.type==="Document"){payload.reviewed_by=user.id;payload.reviewed_at=new Date().toISOString()}const{error}=await supabase.from(table).update(payload).eq("id",item.id);if(error)throw error;await supabase.from("audit_logs").insert({actor_id:user.id,action:`${item.type.toLowerCase()}.${approved?"approved":"rejected"}`,entity_type:item.type.toLowerCase(),entity_id:item.id,metadata:{name:item.name,owner:item.owner}});setMessage(`${item.type} waa la ${approved?"ansixiyey":"diiday"}.`);load()}catch(error){setMessage(error instanceof Error?error.message:"Review-gu wuu fashilmay.")}}
  return <DashboardShell title="Approvals & Verification"><section className="card"><div className="section-head"><div><h2>Waxyaabaha sugaya ansixinta</h2><p className="muted">Companies, vehicles iyo verification documents.</p></div><button className="btn btn-secondary" onClick={load}>Refresh</button></div>{message&&<p className="form-message">{message}</p>}<div className="table-scroll"><table className="table"><thead><tr><th>Type</th><th>Name</th><th>Owner</th><th>Status</th><th>Action</th></tr></thead><tbody>{items.map(item=><tr key={`${item.type}-${item.id}`}><td>{item.type}</td><td><strong>{item.name}</strong></td><td>{item.owner}</td><td><span className={`badge status-${item.status}`}>{item.status.replaceAll("_"," ")}</span></td><td><div className="actions"><button className="btn btn-primary" onClick={()=>review(item,true)}>Approve</button><button className="btn btn-danger" onClick={()=>review(item,false)}>Reject</button></div></td></tr>)}</tbody></table></div>{!items.length&&<p className="empty-state">Wax sugaya ansixin ma jiro.</p>}</section></DashboardShell>
}
