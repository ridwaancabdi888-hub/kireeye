"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/auth";

export default function BookingPage() {
  const [vehicleId, setVehicleId] = useState("");
  const [vehicleName, setVehicleName] = useState("Gaadhiga la doortay");
  const [dailyPrice, setDailyPrice] = useState(95);
  const [days, setDays] = useState(3);
  const [driver, setDriver] = useState(true);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadVehicle() {
      const id = new URLSearchParams(window.location.search).get("vehicle") || "";
      setVehicleId(id);
      if (!id) return;

      try {
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase.from("vehicles").select("name,price_day").eq("id", id).maybeSingle();
        if (data) {
          setVehicleName(data.name);
          setDailyPrice(Number(data.price_day || 95));
        }
      } catch {
        // The fallback UI remains usable before Supabase is connected.
      }
    }
    loadVehicle();
  }, []);

  const rentalAmount = days * dailyPrice;
  const driverAmount = driver ? days * 15 : 0;
  const subtotal = useMemo(() => rentalAmount + driverAmount, [rentalAmount, driverAmount]);
  const fee = Math.round(subtotal * 0.08);
  const total = subtotal + fee;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = `/signin?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        return;
      }
      if (!vehicleId) throw new Error("Gaadhi lama dooran.");

      const form = new FormData(event.currentTarget);
      const paymentMethod = String(form.get("paymentMethod"));
      const { data, error } = await supabase.from("bookings").insert({
        customer_id: user.id,
        vehicle_id: vehicleId,
        pickup_at: String(form.get("pickupAt")),
        return_at: String(form.get("returnAt")),
        rental_type: String(form.get("rentalType")),
        driver_required: driver,
        subtotal,
        commission_amount: fee,
        total,
        status: paymentMethod === "Cash / Pay on pickup" ? "pending" : "awaiting_payment",
      }).select("id").single();
      if (error) throw error;

      if (paymentMethod === "Cash / Pay on pickup") {
        await supabase.from("payments").insert({ booking_id: data.id, method: paymentMethod, amount: total, status: "pending" });
        window.location.href = "/customer";
      } else {
        window.location.href = `/customer/payments/${data.id}?method=${encodeURIComponent(paymentMethod)}&amount=${total}`;
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Booking-ku wuu fashilmay.");
      setLoading(false);
    }
  }

  return <main className="section"><div className="container"><span className="eyebrow">Checkout</span><h1 className="details-title">Dhammaystir booking-ka</h1><form className="checkout-grid" onSubmit={submit}><section className="card auth-form">
    <div className="field"><label>Pickup date & time</label><input name="pickupAt" type="datetime-local" required/></div>
    <div className="field"><label>Return date & time</label><input name="returnAt" type="datetime-local" required/></div>
    <div className="field"><label>Muddada maalmaha</label><input type="number" min="1" value={days} onChange={event => setDays(Math.max(1, Number(event.target.value)))}/></div>
    <div className="field"><label>Habka kirada</label><select name="rentalType"><option value="daily">Maalinle</option><option value="hourly">Saacadle</option><option value="intercity">Safar magaalo kale</option><option value="airport">Airport pickup</option></select></div>
    <label className="checkbox"><input type="checkbox" checked={driver} onChange={event => setDriver(event.target.checked)}/> Darawal ku dar ($15 maalintii)</label>
    <div className="field"><label>Habka lacag-bixinta</label><select name="paymentMethod"><option>ZAAD</option><option>E-Dahab</option><option>EVC Plus</option><option>Sahal</option><option>Cash / Pay on pickup</option></select></div>
    <button className="btn btn-primary" disabled={loading}>{loading ? "Waa la gudbinayaa..." : "Xaqiiji booking-ka"}</button>
    {message && <p className="form-message">{message}</p>}
  </section><aside className="booking-card"><h2>{vehicleName}</h2><p className="muted">Verified marketplace vehicle</p><div className="summary-line"><span>Kirada</span><strong>${rentalAmount}</strong></div><div className="summary-line"><span>Darawal</span><strong>${driverAmount}</strong></div><div className="summary-line"><span>Service fee</span><strong>${fee}</strong></div><div className="summary-line total"><span>Total</span><strong>${total}</strong></div><p className="muted">Mobile-money payment-ku wuxuu marayaa manual verification ilaa API rasmi ah la xiro.</p></aside></form></div></main>;
}
