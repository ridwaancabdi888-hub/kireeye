"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";

const initial=[
  {id:1,type:"Company",name:"Hargeisa Premium Rentals",owner:"Abdi Hassan",status:"Pending"},
  {id:2,type:"Vehicle",name:"Toyota Prado 2021",owner:"Sahal Transport",status:"Pending"},
  {id:3,type:"Car Owner",name:"Ayaan Maxamed",owner:"Individual owner",status:"Pending"}
];

export default function ApprovalsPage(){
  const [items,setItems]=useState(initial);
  function update(id:number,status:string){setItems(items.map(item=>item.id===id?{...item,status}:item))}
  return <DashboardShell title="Approvals & Verification"><section className="card"><div className="section-head"><div><h2>Waxyaabaha sugaya ansixinta</h2><p className="muted">Companies, car owners iyo gaadiidka cusub</p></div></div><table className="table"><thead><tr><th>Type</th><th>Name</th><th>Owner</th><th>Status</th><th>Action</th></tr></thead><tbody>{items.map(item=><tr key={item.id}><td>{item.type}</td><td><strong>{item.name}</strong></td><td>{item.owner}</td><td><span className="badge">{item.status}</span></td><td><div className="actions"><button className="btn btn-primary" onClick={()=>update(item.id,"Approved")}>Approve</button><button className="btn btn-secondary" onClick={()=>update(item.id,"Rejected")}>Reject</button></div></td></tr>)}</tbody></table></section></DashboardShell>
}
