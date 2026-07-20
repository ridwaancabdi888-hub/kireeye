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
    params.then(({ bookingId: id }) => setBookingId(id));
    const query = new URLSearchParams(window.location.search);
    setMethod(query.get("method") || "ZAAD");
    setAmount(Number(query.get("amount") || 0));
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

    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Fadlan soo gal.");

      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const storagePath = `${user.id}/${bookingId}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("payment-proofs").upload(storagePath, file, { upsert: false });
      if (uploadError) throw uploadError;

      const form = new FormData(event.currentTarget);
      const { error: paymentError } = await supabase.from("payments").insert({
        booking_id: bookingId,
        method,
        amount,
        reference: String(form.get("reference") || ""),
        status: "pending",
        proof_url: storagePath,
      });
      if (paymentError) throw paymentError;

      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Payment-ka waa la gudbiyey",
        body: `Receipt-ka ${method} ee booking-kaaga ayaa sugaya xaqiijinta Admin-ka.`,
        type: "payment",
        link: "/customer",
      });

      setMessage("Payment proof-ka waa la gudbiyey. Admin ayaa xaqiijinaya.");
      setTimeout(() => { window.location.href = "/customer"; }, 1200);
    } catch (error) {
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
      <button className="btn btn-primary" disabled={loading}>{loading ? "Waa la gudbinayaa..." : "Gudbi payment proof"}</button>
      {message && <p className="form-message">{message}</p>}
    </form>
    <aside className="booking-card"><h2>Ka hor intaadan gudbin</h2><p className="muted">Hubi in number-ka, amount-ka iyo transaction reference-ku sax yihiin. Screenshot-ka waa inuu si cad u muujiyo lacag-bixinta.</p><div className="summary-line"><span>Status</span><strong>Pending verification</strong></div><div className="summary-line"><span>Booking</span><strong>{bookingId.slice(0,8) || "Loading"}</strong></div></aside>
  </div></DashboardShell>;
}
