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
        const { data } = await supabase.from("vehicles").select("name,price_day,driver_available,self_drive_allowed").eq("id", id).maybeSingle();
        if (data) {
          setVehicleName(data.name);
          setDailyPrice(Number(data.price_day || 95));
          if (!data.driver_available && data.self_drive_allowed) setDriver(false);
        }
      } catch {
        // The API remains authoritative when Supabase is configured.
      }
    }
    loadVehicle();
  }, []);

  const rentalAmount = days * dailyPrice;
  const driverAmount = driver ? days * 15 : 0;
  const subtotal = useMemo(() => rentalAmount + driverAmount, [rentalAmount, driverAmount]);
  const estimatedFee = Number((subtotal * 0.08).toFixed(2));
  const estimatedTotal = Number((subtotal + estimatedFee).toFixed(2));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (!vehicleId) throw new Error("Gaadhi lama dooran.");
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId,
          pickupAt: form.get("pickupAt"),
          returnAt: form.get("returnAt"),
          rentalType: form.get("rentalType"),
          paymentMethod: form.get("paymentMethod"),
          driverRequired: driver,
        }),
      });
      const result = await response.json();
      if (response.status === 401) {
        window.location.href = `/signin?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        return;
      }
      if (!response.ok) throw new Error(result.error || "Booking-ku wuu fashilmay.");

      if (result.paymentMethod === "Cash / Pay on pickup") window.location.href = "/customer/bookings";
      else window.location.href = `/customer/payments/${result.bookingId}?method=${encodeURIComponent(result.paymentMethod)}&amount=${result.total}`;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Booking-ku wuu fashilmay.");
      setLoading(false);
    }
  }

  return <main className="section"><div className="container"><span className="eyebrow">Secure checkout</span><h1 className="details-title">Dhammaystir booking-ka</h1><form className="checkout-grid" onSubmit={submit}><section className="card auth-form">
    <div className="field"><label>Pickup date & time</label><input name="pickupAt" type="datetime-local" required/></div>
    <div className="field"><label>Return date & time</label><input name="returnAt" type="datetime-local" required/></div>
    <div className="field"><label>Muddada qiyaasta maalmaha</label><input type="number" min="1" value={days} onChange={event => setDays(Math.max(1, Number(event.target.value)))}/></div>
    <div className="field"><label>Habka kirada</label><select name="rentalType"><option value="daily">Maalinle</option><option value="hourly">Saacadle</option><option value="weekly">Toddobaadle</option><option value="monthly">Bille</option><option value="intercity">Safar magaalo kale</option><option value="airport">Airport pickup</option></select></div>
    <label className="checkbox"><input type="checkbox" checked={driver} onChange={event => setDriver(event.target.checked)}/> Darawal ku dar ($15 maalintii)</label>
    <div className="field"><label>Habka lacag-bixinta</label><select name="paymentMethod"><option>ZAAD</option><option>E-Dahab</option><option>EVC Plus</option><option>Sahal</option><option>Cash / Pay on pickup</option></select></div>
    <button className="btn btn-primary" disabled={loading}>{loading ? "Waa la xaqiijinayaa..." : "Xaqiiji booking-ka"}</button>
    {message && <p className="form-message">{message}</p>}
  </section><aside className="booking-card"><h2>{vehicleName}</h2><p className="muted">Server-ku wuxuu xaqiijinayaa availability-ga iyo qiimaha kama dambaysta ah.</p><div className="summary-line"><span>Kirada qiyaasta</span><strong>${rentalAmount}</strong></div><div className="summary-line"><span>Darawal</span><strong>${driverAmount}</strong></div><div className="summary-line"><span>Service fee qiyaasta</span><strong>${estimatedFee}</strong></div><div className="summary-line total"><span>Estimated total</span><strong>${estimatedTotal}</strong></div><p className="muted">Qiimaha rasmiga ah waxaa xisaabinaya server-ka iyadoo lagu salaynayo waqtiga, rental type-ka iyo commission-ka company-ga.</p></aside></form></div></main>;
}
