"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { createSupabaseBrowserClient } from "@/lib/auth";

export default function PaymentProofPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const [bookingId, setBookingId] = useState("");
  const [method, setMethod] = useState("ZAAD");
  const [amount, setAmount] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    params.then(async ({ bookingId: id }) => {
      setBookingId(id);
      try {
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase.from("bookings").select("total,status").eq("id", id).maybeSingle();
        if (data) setAmount(Number(data.total || 0));
      } catch {
        setAmount(Number(new URLSearchParams(window.location.search).get("amount") || 0));
      }
    });
    const query = new URLSearchParams(window.location.search);
    setMethod(query.get("method") || "ZAAD");
  }, [params]);

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] || null;
    setFile(selected);
    if (selected?.type.startsWith("image/")) setPreview(URL.createObjectURL(selected));
    else setPreview(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return setMessage("Fadlan geli screenshot-ka ama receipt-ka lacag-bixinta.");
    setLoading(true);
    setMessage("");
    let storagePath = "";

    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Fadlan soo gal.");

      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      storagePath = `${user.id}/${bookingId}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("payment-proofs").upload(storagePath, file, { upsert: false });
      if (uploadError) throw uploadError;

      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/payments/proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, method, reference: form.get("reference"), proofPath: storagePath }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Payment proof-ka lama gudbin.");

      setAmount(Number(result.amount));
      setMessage("Payment proof-ka waa la gudbiyey. Admin ayaa xaqiijinaya.");
      setTimeout(() => { window.location.href = "/customer/bookings"; }, 1200);
    } catch (error) {
      if (storagePath) {
        try {
          const supabase = createSupabaseBrowserClient();
          await supabase.storage.from("payment-proofs").remove([storagePath]);
        } catch { /* cleanup is best effort */ }
      }
      setMessage(error instanceof Error ? error.message : "Payment proof-ka lama gudbin.");
      setLoading(false);
    }
  }

  return <DashboardShell title="Gudbi lacag-bixinta"><div className="checkout-grid">
    <form className="card auth-form" onSubmit={submit}>
      <span className="badge">Manual verification</span>
      <h2>{method} payment</h2>
      <div className="payment-instructions"><strong>U dir lacagta:</strong><span>+252 63 4199277</span><strong>Amount:</strong><span>${amount}</span></div>
      <div className="field"><label>Transaction reference</label><input name="reference" required placeholder="Tusaale: TXN-123456"/></div>
      <div className="field"><label>Screenshot ama receipt</label><input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required onChange={chooseFile}/></div>
      {preview && <img className="payment-preview" src={preview} alt="Payment proof preview"/>}
      <button className="btn btn-primary" disabled={loading || !bookingId}>{loading ? "Waa la gudbinayaa..." : "Gudbi payment proof"}</button>
      {message && <p className="form-message">{message}</p>}
    </form>
    <aside className="booking-card"><h2>Ka hor intaadan gudbin</h2><p className="muted">Hubi in number-ka, amount-ka iyo transaction reference-ku sax yihiin. Server-ku wuxuu amount-ka ka xaqiijinayaa booking-ka.</p><div className="summary-line"><span>Status</span><strong>Pending verification</strong></div><div className="summary-line"><span>Booking</span><strong>{bookingId.slice(0,8) || "Loading"}</strong></div></aside>
  </div></DashboardShell>;
}
