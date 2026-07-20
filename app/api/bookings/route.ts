import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase-server";

const allowedRentalTypes = new Set(["hourly","daily","weekly","monthly","intercity","airport"]);
const allowedPaymentMethods = new Set(["ZAAD","E-Dahab","EVC Plus","Sahal","Cash / Pay on pickup"]);

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const admin = createSupabaseAdminClient();
    if (!supabase || !admin) return NextResponse.json({ error: "Supabase configuration is missing." }, { status: 503 });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const vehicleId = String(body.vehicleId || "");
    const pickupAt = new Date(String(body.pickupAt || ""));
    const returnAt = new Date(String(body.returnAt || ""));
    const rentalType = allowedRentalTypes.has(String(body.rentalType)) ? String(body.rentalType) : "daily";
    const paymentMethod = allowedPaymentMethods.has(String(body.paymentMethod)) ? String(body.paymentMethod) : "Cash / Pay on pickup";
    const driverRequired = Boolean(body.driverRequired);

    if (!vehicleId || Number.isNaN(pickupAt.getTime()) || Number.isNaN(returnAt.getTime()) || returnAt <= pickupAt) {
      return NextResponse.json({ error: "Booking dates or vehicle are invalid." }, { status: 400 });
    }
    if (pickupAt.getTime() < Date.now() - 5 * 60 * 1000) return NextResponse.json({ error: "Pickup time cannot be in the past." }, { status: 400 });

    const { data: vehicle, error: vehicleError } = await admin.from("vehicles").select("id,name,status,company_id,price_hour,price_day,price_week,price_month,driver_available,self_drive_allowed,intercity_allowed,companies(commission_percent)").eq("id", vehicleId).single();
    if (vehicleError || !vehicle) return NextResponse.json({ error: "Vehicle was not found." }, { status: 404 });
    if (vehicle.status !== "available") return NextResponse.json({ error: "Vehicle is not available." }, { status: 409 });
    if (driverRequired && !vehicle.driver_available) return NextResponse.json({ error: "Driver is not available for this vehicle." }, { status: 400 });
    if (!driverRequired && !vehicle.self_drive_allowed) return NextResponse.json({ error: "Self-drive is not allowed for this vehicle." }, { status: 400 });
    if (rentalType === "intercity" && !vehicle.intercity_allowed) return NextResponse.json({ error: "Intercity travel is not allowed for this vehicle." }, { status: 400 });

    const durationHours = Math.max(1, Math.ceil((returnAt.getTime() - pickupAt.getTime()) / 3_600_000));
    const durationDays = Math.max(1, Math.ceil(durationHours / 24));
    let rentalAmount = 0;
    if (rentalType === "hourly") rentalAmount = durationHours * Number(vehicle.price_hour || 0);
    else if (rentalType === "weekly") rentalAmount = Math.max(1, Math.ceil(durationDays / 7)) * Number(vehicle.price_week || vehicle.price_day * 7 || 0);
    else if (rentalType === "monthly") rentalAmount = Math.max(1, Math.ceil(durationDays / 30)) * Number(vehicle.price_month || vehicle.price_day * 30 || 0);
    else rentalAmount = durationDays * Number(vehicle.price_day || 0);
    if (rentalAmount <= 0) return NextResponse.json({ error: "Vehicle pricing is incomplete." }, { status: 400 });

    const driverAmount = driverRequired ? durationDays * 15 : 0;
    const subtotal = Number((rentalAmount + driverAmount).toFixed(2));
    const relation = vehicle.companies as unknown as { commission_percent?: number } | null;
    let commissionPercent = Number(relation?.commission_percent || 0);
    if (!commissionPercent) {
      const { data: setting } = await admin.from("site_settings").select("value").eq("key", "commission").maybeSingle();
      commissionPercent = Number(setting?.value?.default_percent || 8);
    }
    const commissionAmount = Number((subtotal * commissionPercent / 100).toFixed(2));
    const total = Number((subtotal + commissionAmount).toFixed(2));
    const status = paymentMethod === "Cash / Pay on pickup" ? "pending" : "awaiting_payment";

    const { data: booking, error: bookingError } = await admin.from("bookings").insert({
      customer_id: user.id,
      vehicle_id: vehicleId,
      pickup_at: pickupAt.toISOString(),
      return_at: returnAt.toISOString(),
      rental_type: rentalType,
      driver_required: driverRequired,
      subtotal,
      commission_amount: commissionAmount,
      total,
      status,
    }).select("id,status,total").single();
    if (bookingError) throw bookingError;

    if (paymentMethod === "Cash / Pay on pickup") {
      const { error: paymentError } = await admin.from("payments").insert({ booking_id: booking.id, method: paymentMethod, amount: total, status: "pending" });
      if (paymentError) throw paymentError;
    }

    await admin.from("audit_logs").insert({ actor_id: user.id, action: "booking.created", entity_type: "booking", entity_id: booking.id, metadata: { vehicle_id: vehicleId, rental_type: rentalType, payment_method: paymentMethod, total } });

    return NextResponse.json({ bookingId: booking.id, status: booking.status, total, paymentMethod });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Booking could not be created.";
    const status = message.toLowerCase().includes("not available") ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
