"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { createSupabaseBrowserClient } from "@/lib/auth";

type Payment={id:string;amount:number;status:string;method:string;created_at:string;bookings:{commission_amount:number;vehicles:{name:string}|null}|null};

export default function CompanyPaymentsPage(){
  const[items,setItems]=useState<Payment[]>([]);const[message,setMessage]=useState("");
  useEffect(()=>{(async()=>{try{const supabase=createSupabaseBrowserClient();const{data,error}=await supabase.from("payments").select("id,amount,status,method,created_at,bookings(commission_amount,vehicles(name))").order("created_at",{ascending:false}).limit(100);if(error)throw error;setItems((data||[]) as unknown as Payment[])}catch(error){setMessage(error instanceof Error?error.message:"Payments lama soo qaadi karin.")}})()},[]);
  const totals=useMemo(()=>items.reduce((acc,item)=>{if(item.status==="approved"){acc.gross+=Number(item.amount||0);acc.commission+=Number(item.bookings?.commission_amount||0)}return acc},{gross:0,commission:0}),[items]);
  return <DashboardShell title="Payments & Earnings"><section className="kpis"><div className="kpi"><span className="muted">Gross revenue</span><strong>${totals.gross.toFixed(2)}</strong></div><div className="kpi"><span className="muted">Kireeye commission</span><strong>${totals.commission.toFixed(2)}</strong></div><div className="kpi"><span className="muted">Net earnings</span><strong>${(totals.gross-totals.commission).toFixed(2)}</strong></div><div className="kpi"><span className="muted">Transactions</span><strong>{items.length}</strong></div></section><section className="section"><div className="card">{message&&<p className="form-message">{message}</p>}<div className="table-scroll"><table className="table"><thead><tr><th>Vehicle</th><th>Method</th><th>Amount</th><th>Commission</th><th>Status</th><th>Date</th></tr></thead><tbody>{items.map(item=><tr key={item.id}><td>{item.bookings?.vehicles?.name||"Vehicle"}</td><td>{item.method}</td><td>${item.amount}</td><td>${item.bookings?.commission_amount||0}</td><td><span className={`badge status-${item.status}`}>{item.status}</span></td><td>{new Date(item.created_at).toLocaleDateString()}</td></tr>)}</tbody></table></div>{!items.length&&<p className="empty-state">Payment wali ma jiro.</p>}</div></section></DashboardShell>
}
