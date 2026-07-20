"use client";

import { FormEvent, useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { createSupabaseBrowserClient } from "@/lib/auth";

export default function ReviewPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const [bookingId, setBookingId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    params.then(async ({ bookingId: id }) => {
      setBookingId(id);
      try {
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase.from("bookings").select("vehicle_id,status").eq("id", id).maybeSingle();
        if (!data) return setMessage("Booking-kan lama helin.");
        if (data.status !== "completed") setMessage("Review waxaa la bixin karaa marka booking-ku completed noqdo.");
        setVehicleId(data.vehicle_id);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Booking-ka lama hubin.");
      }
    });
  }, [params]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Fadlan soo gal.");
      if (!vehicleId) throw new Error("Vehicle lama helin.");

      const form = new FormData(event.currentTarget);
      const { error } = await supabase.from("reviews").insert({
        booking_id: bookingId,
        customer_id: user.id,
        vehicle_id: vehicleId,
        rating,
        comment: String(form.get("comment") || ""),
      });
      if (error) throw error;

      setMessage("Mahadsanid. Review-gaaga waa la gudbiyey.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Review-ga lama gudbin.");
    } finally {
      setLoading(false);
    }
  }

  return <DashboardShell title="Qiimee safarka"><form className="card auth-form review-form" onSubmit={submit}>
    <span className="eyebrow">Booking completed</span>
    <h2>Sidee ayuu ahaa safarkaaga?</h2>
    <div className="rating-picker">{[1,2,3,4,5].map(star => <button key={star} type="button" className={star <= rating ? "star active" : "star"} onClick={() => setRating(star)}>★</button>)}</div>
    <div className="field"><label>Faallo</label><textarea name="comment" rows={6} required placeholder="Nala wadaag gaadhiga, shirkadda iyo adeegga sida ay ahaayeen."/></div>
    <button className="btn btn-primary" disabled={loading || !vehicleId}>{loading ? "Waa la gudbinayaa..." : "Gudbi review"}</button>
    {message && <p className="form-message">{message}</p>}
  </form></DashboardShell>;
}
