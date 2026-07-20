"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { createSupabaseBrowserClient } from "@/lib/auth";

type Booking={id:string;pickup_at:string;return_at:string;total:number;status:string;vehicles:{name:string}|null;profiles:{full_name:string;phone:string|null}|null};

export default function CompanyBookingsPage(){
  const[items,setItems]=useState<Booking[]>([]);const[message,setMessage]=useState("");
  async function load(){try{const supabase=createSupabaseBrowserClient();const{data,error}=await supabase.from("bookings").select("id,pickup_at,return_at,total,status,vehicles(name),profiles!bookings_customer_id_fkey(full_name,phone)").order("created_at",{ascending:false}).limit(100);if(error)throw error;setItems((data||[]) as unknown as Booking[])}catch(error){setMessage(error instanceof Error?error.message:"Bookings lama soo qaadi karin.")}}
  useEffect(()=>{load()},[]);
  async function updateStatus(id:string,status:string){const supabase=createSupabaseBrowserClient();const{error}=await supabase.from("bookings").update({status}).eq("id",id);if(error)return setMessage(error.message);setMessage(`Booking-ka wuxuu noqday ${status}.`);load()}
  return <DashboardShell title="Bookings"><section className="list-stack">{message&&<p className="form-message">{message}</p>}{items.map(item=><article className="list-card" key={item.id}><div><div className="row"><h2>{item.vehicles?.name||"Gaadhi"}</h2><span className={`badge status-${item.status}`}>{item.status.replaceAll("_"," ")}</span></div><p className="muted">Customer: {item.profiles?.full_name||"Customer"} · {item.profiles?.phone||"Phone unavailable"}</p><p className="muted">{new Date(item.pickup_at).toLocaleString()} → {new Date(item.return_at).toLocaleString()}</p><strong>${item.total}</strong></div><div className="actions">{item.status==="pending"&&<button className="btn btn-primary" onClick={()=>updateStatus(item.id,"confirmed")}>Confirm</button>}{item.status==="confirmed"&&<button className="btn btn-primary" onClick={()=>updateStatus(item.id,"in_progress")}>Picked up</button>}{item.status==="in_progress"&&<button className="btn btn-primary" onClick={()=>updateStatus(item.id,"completed")}>Complete</button>}{["pending","confirmed"].includes(item.status)&&<button className="btn btn-danger" onClick={()=>updateStatus(item.id,"rejected")}>Reject</button>}</div></article>)}{!items.length&&<div className="card empty-state">Booking wali ma jiro.</div>}</section></DashboardShell>
}
