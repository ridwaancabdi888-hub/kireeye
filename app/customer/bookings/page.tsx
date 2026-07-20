"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { createSupabaseBrowserClient } from "@/lib/auth";

type Booking = { id:string; pickup_at:string; return_at:string; total:number; status:string; vehicle_id:string; vehicles:{name:string}|null };

export default function CustomerBookingsPage() {
  const [items, setItems] = useState<Booking[]>([]);
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase.from("bookings").select("id,pickup_at,return_at,total,status,vehicle_id,vehicles(name)").eq("customer_id", user.id).order("created_at", { ascending: false });
      if (error) throw error;
      setItems((data || []) as unknown as Booking[]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Bookings lama soo qaadi karin.");
    }
  }

  useEffect(() => { load(); }, []);

  async function cancel(id: string) {
    setMessage("");
    try {
      const response = await fetch(`/api/bookings/${id}/cancel`, { method: "POST" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Booking-ka lama cancel-gareyn.");
      setMessage(result.cancellationType === "late" ? "Booking-ka waa la cancel-gareeyey. Late-cancellation policy ayaa khusayn karta." : "Booking-ka waa la cancel-gareeyey lacag la’aan.");
      load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Booking-ka lama cancel-gareyn.");
    }
  }

  return <DashboardShell title="Bookings-kayga"><section className="list-stack">
    {message && <p className="form-message">{message}</p>}
    {items.map(item => <article className="list-card" key={item.id}><div><div className="row"><h2>{item.vehicles?.name || "Gaadhi"}</h2><span className={`badge status-${item.status}`}>{item.status.replaceAll("_"," ")}</span></div><p className="muted">{new Date(item.pickup_at).toLocaleString()} → {new Date(item.return_at).toLocaleString()}</p><strong>${item.total}</strong></div><div className="actions">{item.status === "awaiting_payment" && <Link className="btn btn-primary" href={`/customer/payments/${item.id}?amount=${item.total}`}>Bixi lacagta</Link>}{item.status === "completed" && <Link className="btn btn-secondary" href={`/customer/reviews/${item.id}`}>Review</Link>}{["pending","awaiting_payment","confirmed"].includes(item.status) && <button className="btn btn-danger" onClick={() => cancel(item.id)}>Cancel</button>}</div></article>)}
    {!items.length && <div className="card empty-state"><h2>Booking wali ma lihid</h2><p>Raadi gaadhi ku habboon safarkaaga.</p><Link className="btn btn-primary" href="/vehicles">Raadi gaadhi</Link></div>}
  </section></DashboardShell>;
}
