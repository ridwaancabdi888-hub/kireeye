"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { createSupabaseBrowserClient } from "@/lib/auth";

type Payment = {
  id: string;
  method: string;
  amount: number;
  currency: string;
  reference: string | null;
  status: string;
  proof_url: string | null;
  created_at: string;
  booking_id: string;
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.from("payments").select("id,booking_id,method,amount,currency,reference,status,proof_url,created_at").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Payments lama soo qaadi karin.");
    }
  }

  useEffect(() => { load(); }, []);

  async function review(payment: Payment, status: "approved" | "rejected") {
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("payments").update({ status, reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq("id", payment.id);
    if (error) return setMessage(error.message);

    if (status === "approved") await supabase.from("bookings").update({ status: "confirmed" }).eq("id", payment.booking_id);
    if (status === "rejected") await supabase.from("bookings").update({ status: "awaiting_payment" }).eq("id", payment.booking_id);

    await supabase.from("audit_logs").insert({ actor_id: user.id, action: `payment.${status}`, entity_type: "payment", entity_id: payment.id, metadata: { booking_id: payment.booking_id, amount: payment.amount } });
    setMessage(`Payment-ka waa la ${status === "approved" ? "ansixiyey" : "diiday"}.`);
    load();
  }

  async function openProof(payment: Payment) {
    if (!payment.proof_url) return;
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.storage.from("payment-proofs").createSignedUrl(payment.proof_url, 120);
    if (error) return setMessage(error.message);
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  return <DashboardShell title="Payment Verification"><section className="card">
    <div className="section-head"><div><h2>Payments-ka sugaya xaqiijinta</h2><p className="muted">Hubi transaction reference iyo receipt-ka ka hor ansixinta.</p></div><button className="btn btn-secondary" onClick={load}>Refresh</button></div>
    {message && <p className="form-message">{message}</p>}
    <div className="table-scroll"><table className="table"><thead><tr><th>Method</th><th>Amount</th><th>Reference</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead><tbody>{payments.map(payment => <tr key={payment.id}><td><strong>{payment.method}</strong></td><td>${payment.amount} {payment.currency}</td><td>{payment.reference || "—"}</td><td><span className="badge">{payment.status}</span></td><td>{new Date(payment.created_at).toLocaleDateString()}</td><td><div className="actions"><button className="btn btn-secondary" onClick={() => openProof(payment)}>Receipt</button><button className="btn btn-primary" onClick={() => review(payment,"approved")}>Approve</button><button className="btn btn-danger" onClick={() => review(payment,"rejected")}>Reject</button></div></td></tr>)}</tbody></table></div>
    {!payments.length && <p className="muted">Payment wali lama gudbin.</p>}
  </section></DashboardShell>;
}
