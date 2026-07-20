"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { createSupabaseBrowserClient } from "@/lib/auth";

type Vehicle={id:string;name:string;category:string|null;status:string;price_day:number|null;featured:boolean;booking_count:number;rating:number;companies:{name:string}|null;profiles:{full_name:string}|null};

export default function AdminVehiclesPage(){
  const[items,setItems]=useState<Vehicle[]>([]);const[message,setMessage]=useState("");
  async function load(){try{const supabase=createSupabaseBrowserClient();const{data,error}=await supabase.from("vehicles").select("id,name,category,status,price_day,featured,booking_count,rating,companies(name),profiles!vehicles_owner_id_fkey(full_name)").order("created_at",{ascending:false}).limit(250);if(error)throw error;setItems((data||[]) as unknown as Vehicle[])}catch(error){setMessage(error instanceof Error?error.message:"Vehicles lama soo qaadi karin.")}}
  useEffect(()=>{load()},[]);
  async function update(item:Vehicle,changes:Record<string,unknown>){const supabase=createSupabaseBrowserClient();const{data:{user}}=await supabase.auth.getUser();if(!user)return;const{error}=await supabase.from("vehicles").update(changes).eq("id",item.id);if(error)return setMessage(error.message);await supabase.from("audit_logs").insert({actor_id:user.id,action:"vehicle.updated",entity_type:"vehicle",entity_id:item.id,metadata:changes});load()}
  return <DashboardShell title="Vehicles"><section className="card"><div className="section-head"><div><h2>Dhammaan gaadiidka</h2><p className="muted">Approvals, featured listings iyo status management.</p></div><button className="btn btn-secondary" onClick={load}>Refresh</button></div>{message&&<p className="form-message">{message}</p>}<div className="table-scroll"><table className="table"><thead><tr><th>Vehicle</th><th>Owner/Company</th><th>Price</th><th>Performance</th><th>Status</th><th>Featured</th><th>Actions</th></tr></thead><tbody>{items.map(item=><tr key={item.id}><td><strong>{item.name}</strong><br/><span className="muted">{item.category||"Vehicle"}</span></td><td>{item.companies?.name||item.profiles?.full_name||"Owner"}</td><td>${item.price_day||0}/day</td><td>{item.booking_count||0} bookings · ★ {Number(item.rating||0).toFixed(1)}</td><td><span className={`badge status-${item.status}`}>{item.status.replaceAll("_"," ")}</span></td><td><input type="checkbox" checked={item.featured||false} onChange={e=>update(item,{featured:e.target.checked})}/></td><td><div className="actions">{item.status!=="available"&&<button className="btn btn-primary" onClick={()=>update(item,{status:"available"})}>Activate</button>}<button className="btn btn-danger" onClick={()=>update(item,{status:"suspended"})}>Suspend</button></div></td></tr>)}</tbody></table></div></section></DashboardShell>
}
