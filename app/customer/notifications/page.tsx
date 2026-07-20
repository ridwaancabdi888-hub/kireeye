"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/DashboardShell";
import { createSupabaseBrowserClient } from "@/lib/auth";

type Notification = {
  id: string;
  title: string;
  body: string;
  type: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase.from("notifications").select("id,title,body,type,link,read_at,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Notifications lama soo qaadi karin.");
    }
  }

  useEffect(() => { load(); }, []);

  async function markRead(id: string) {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    if (error) return setMessage(error.message);
    setItems(items.map(item => item.id === id ? { ...item, read_at: new Date().toISOString() } : item));
  }

  async function markAllRead() {
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const now = new Date().toISOString();
    const { error } = await supabase.from("notifications").update({ read_at: now }).eq("user_id", user.id).is("read_at", null);
    if (error) return setMessage(error.message);
    setItems(items.map(item => ({ ...item, read_at: item.read_at || now })));
  }

  return <DashboardShell title="Notifications"><section className="card">
    <div className="section-head"><div><h2>Fariimahaaga</h2><p className="muted">Booking, payment, verification iyo system updates.</p></div><button className="btn btn-secondary" onClick={markAllRead}>Dhammaan akhri</button></div>
    {message && <p className="form-message">{message}</p>}
    <div className="notification-list">{items.map(item => <article className={`notification-item ${item.read_at ? "" : "unread"}`} key={item.id} onClick={() => !item.read_at && markRead(item.id)}><div className="notification-icon">{item.type === "payment" ? "💳" : item.type === "booking" ? "🚙" : "🔔"}</div><div><div className="row"><strong>{item.title}</strong><span className="muted">{new Date(item.created_at).toLocaleString()}</span></div><p className="muted">{item.body}</p>{item.link && <Link className="text-link" href={item.link}>Faahfaahin →</Link>}</div></article>)}</div>
    {!items.length && <p className="muted">Notification cusub ma jiro.</p>}
  </section></DashboardShell>;
}
