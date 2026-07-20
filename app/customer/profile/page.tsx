"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { createSupabaseBrowserClient } from "@/lib/auth";

type Document = { id:string; document_type:string; status:string; created_at:string };

export default function CustomerProfilePage(){
  const[profile,setProfile]=useState({full_name:"",phone:"",email:"",preferred_language:"so"});
  const[documents,setDocuments]=useState<Document[]>([]);
  const[message,setMessage]=useState("");
  const[uploading,setUploading]=useState(false);

  async function load(){
    try{
      const supabase=createSupabaseBrowserClient();
      const{data:{user}}=await supabase.auth.getUser();if(!user)return;
      const[{data:p},{data:d}]=await Promise.all([
        supabase.from("profiles").select("full_name,phone,email,preferred_language").eq("id",user.id).single(),
        supabase.from("verification_documents").select("id,document_type,status,created_at").eq("user_id",user.id).order("created_at",{ascending:false})
      ]);
      if(p)setProfile(p);
      setDocuments(d||[]);
    }catch(error){setMessage(error instanceof Error?error.message:"Profile-ka lama soo qaadi karin.")}
  }
  useEffect(()=>{load()},[]);

  async function save(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const supabase=createSupabaseBrowserClient();
    const{data:{user}}=await supabase.auth.getUser();if(!user)return;
    const{error}=await supabase.from("profiles").update(profile).eq("id",user.id);
    setMessage(error?error.message:"Profile-ka waa la kaydiyey.");
  }

  async function upload(event:ChangeEvent<HTMLInputElement>,documentType:string){
    const file=event.target.files?.[0];if(!file)return;
    setUploading(true);setMessage("");
    try{
      const supabase=createSupabaseBrowserClient();
      const{data:{user}}=await supabase.auth.getUser();if(!user)throw new Error("Fadlan soo gal.");
      const ext=file.name.split(".").pop()||"pdf";
      const path=`${user.id}/${documentType}/${crypto.randomUUID()}.${ext}`;
      const{error:uploadError}=await supabase.storage.from("verification-documents").upload(path,file);
      if(uploadError)throw uploadError;
      const{error:insertError}=await supabase.from("verification_documents").insert({user_id:user.id,document_type:documentType,storage_path:path,status:"pending"});
      if(insertError)throw insertError;
      setMessage(`${documentType} waa la gudbiyey.`);load();
    }catch(error){setMessage(error instanceof Error?error.message:"Document-ka lama gelin.")}
    finally{setUploading(false);event.target.value=""}
  }

  return <DashboardShell title="Profile & Documents"><div className="profile-grid"><form className="card auth-form" onSubmit={save}><h2>Xogtaada</h2><div className="field"><label>Magaca</label><input value={profile.full_name} onChange={e=>setProfile({...profile,full_name:e.target.value})}/></div><div className="field"><label>Phone</label><input value={profile.phone||""} onChange={e=>setProfile({...profile,phone:e.target.value})}/></div><div className="field"><label>Email</label><input value={profile.email||""} disabled/></div><div className="field"><label>Luuqadda</label><select value={profile.preferred_language} onChange={e=>setProfile({...profile,preferred_language:e.target.value})}><option value="so">Somali</option><option value="en">English</option><option value="ar">العربية</option></select></div><button className="btn btn-primary">Kaydi profile-ka</button>{message&&<p className="form-message">{message}</p>}</form><section className="card"><h2>Verification documents</h2><p className="muted">Self-drive booking-ka waxaa looga baahan karaa ID iyo driving licence.</p>{["national_id","passport","driving_licence","selfie"].map(type=><div className="document-row" key={type}><div><strong>{type.replaceAll("_"," ")}</strong><p className="muted">JPEG, PNG ama PDF</p></div><label className="btn btn-secondary">{uploading?"Uploading...":"Upload"}<input hidden type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e=>upload(e,type)} disabled={uploading}/></label></div>)}<h3>La gudbiyey</h3><div className="document-list">{documents.map(doc=><div className="document-row" key={doc.id}><span>{doc.document_type.replaceAll("_"," ")}</span><span className={`badge status-${doc.status}`}>{doc.status}</span></div>)}</div></section></div></DashboardShell>
}
