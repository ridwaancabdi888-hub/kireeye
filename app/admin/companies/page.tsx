"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { createSupabaseBrowserClient } from "@/lib/auth";

type Company={id:string;name:string;phone:string|null;email:string|null;status:string;commission_percent:number;created_at:string;profiles:{full_name:string}|null;vehicles:{count:number}[]};

export default function AdminCompaniesPage(){
  const[items,setItems]=useState<Company[]>([]);const[message,setMessage]=useState("");
  async function load(){try{const supabase=createSupabaseBrowserClient();const{data,error}=await supabase.from("companies").select("id,name,phone,email,status,commission_percent,created_at,profiles!companies_owner_id_fkey(full_name),vehicles(count)").order("created_at",{ascending:false});if(error)throw error;setItems((data||[]) as unknown as Company[])}catch(error){setMessage(error instanceof Error?error.message:"Companies lama soo qaadi karin.")}}
  useEffect(()=>{load()},[]);
  async function update(item:Company,changes:Record<string,unknown>){const supabase=createSupabaseBrowserClient();const{data:{user}}=await supabase.auth.getUser();if(!user)return;const{error}=await supabase.from("companies").update(changes).eq("id",item.id);if(error)return setMessage(error.message);await supabase.from("audit_logs").insert({actor_id:user.id,action:"company.updated",entity_type:"company",entity_id:item.id,metadata:changes});setMessage("Company-ga waa la cusboonaysiiyey.");load()}
  return <DashboardShell title="Companies"><section className="card"><div className="section-head"><div><h2>Rental companies</h2><p className="muted">Maamul status, commission iyo company profile.</p></div><button className="btn btn-secondary" onClick={load}>Refresh</button></div>{message&&<p className="form-message">{message}</p>}<div className="table-scroll"><table className="table"><thead><tr><th>Company</th><th>Owner</th><th>Contact</th><th>Vehicles</th><th>Commission</th><th>Status</th><th>Action</th></tr></thead><tbody>{items.map(item=><tr key={item.id}><td><strong>{item.name}</strong></td><td>{item.profiles?.full_name||"Owner"}</td><td>{item.phone||item.email||"—"}</td><td>{item.vehicles?.[0]?.count||0}</td><td><input style={{width:80}} type="number" defaultValue={item.commission_percent} onBlur={e=>update(item,{commission_percent:Number(e.target.value)})}/>%</td><td><span className={`badge status-${item.status}`}>{item.status}</span></td><td><div className="actions">{item.status!=="approved"&&<button className="btn btn-primary" onClick={()=>update(item,{status:"approved"})}>Approve</button>}{item.status!=="suspended"&&<button className="btn btn-danger" onClick={()=>update(item,{status:"suspended"})}>Suspend</button>}</div></td></tr>)}</tbody></table></div></section></DashboardShell>
}
