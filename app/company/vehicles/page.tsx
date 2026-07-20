"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { createSupabaseBrowserClient } from "@/lib/auth";

type Vehicle={id:string;name:string;category:string|null;price_day:number|null;status:string;booking_count:number;rating:number};

export default function CompanyVehiclesPage(){
  const[vehicles,setVehicles]=useState<Vehicle[]>([]);const[message,setMessage]=useState("");
  async function load(){try{const supabase=createSupabaseBrowserClient();const{data:{user}}=await supabase.auth.getUser();if(!user)return;const{data,error}=await supabase.from("vehicles").select("id,name,category,price_day,status,booking_count,rating").eq("owner_id",user.id).order("created_at",{ascending:false});if(error)throw error;setVehicles(data||[])}catch(error){setMessage(error instanceof Error?error.message:"Gaadiidka lama soo qaadi karin.")}}
  useEffect(()=>{load()},[]);
  async function archive(id:string){const supabase=createSupabaseBrowserClient();const{error}=await supabase.from("vehicles").update({status:"archived"}).eq("id",id);if(error)return setMessage(error.message);load()}
  return <DashboardShell title="Gaadiidka"><section className="list-stack">{message&&<p className="form-message">{message}</p>}<div className="row"><p className="muted">Maamul listings-ka, qiimaha iyo status-ka.</p><Link className="btn btn-primary" href="/company/vehicles/new">+ Ku dar gaadhi</Link></div>{vehicles.map(vehicle=><article className="list-card" key={vehicle.id}><div><div className="row"><h2>{vehicle.name}</h2><span className={`badge status-${vehicle.status}`}>{vehicle.status.replaceAll("_"," ")}</span></div><p className="muted">{vehicle.category||"Vehicle"} · ${vehicle.price_day||0}/maalin · ★ {Number(vehicle.rating||0).toFixed(1)} · {vehicle.booking_count||0} bookings</p></div><div className="actions"><Link className="btn btn-secondary" href={`/vehicles/${vehicle.id}`}>View</Link><button className="btn btn-danger" onClick={()=>archive(vehicle.id)}>Archive</button></div></article>)}{!vehicles.length&&<div className="card empty-state"><h2>Gaadhi wali lama darin</h2><Link className="btn btn-primary" href="/company/vehicles/new">Ku dar gaadhiga koowaad</Link></div>}</section></DashboardShell>
}
