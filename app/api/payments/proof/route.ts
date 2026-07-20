import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase-server";

const allowedMethods = new Set(["ZAAD","E-Dahab","EVC Plus","Sahal"]);

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const admin = createSupabaseAdminClient();
    if (!supabase || !admin) return NextResponse.json({ error: "Supabase configuration is missing." }, { status: 503 });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const bookingId = String(body.bookingId || "");
    const method = String(body.method || "");
    const reference = String(body.reference || "").trim();
    const proofPath = String(body.proofPath || "");

    if (!bookingId || !allowedMethods.has(method) || !reference || !proofPath.startsWith(`${user.id}/`)) {
      return NextResponse.json({ error: "Payment information is invalid." }, { status: 400 });
    }

    const { data: booking, error: bookingError } = await admin.from("bookings").select("id,customer_id,total,status").eq("id", bookingId).single();
    if (bookingError || !booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    if (booking.customer_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!["awaiting_payment","pending"].includes(booking.status)) return NextResponse.json({ error: "This booking is not awaiting payment." }, { status: 409 });

    const { data: existing } = await admin.from("payments").select("id,status").eq("booking_id", bookingId).in("status", ["pending","approved"]).maybeSingle();
    if (existing) return NextResponse.json({ error: "A payment is already pending or approved for this booking." }, { status: 409 });

    const { data: payment, error: paymentError } = await admin.from("payments").insert({
      booking_id: bookingId,
      method,
      amount: Number(booking.total),
      currency: "USD",
      reference,
      status: "pending",
      proof_url: proofPath,
    }).select("id,status,amount").single();
    if (paymentError) throw paymentError;

    await admin.from("audit_logs").insert({ actor_id: user.id, action: "payment.proof_submitted", entity_type: "payment", entity_id: payment.id, metadata: { booking_id: bookingId, method, reference, amount: payment.amount } });

    return NextResponse.json({ paymentId: payment.id, status: payment.status, amount: payment.amount });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Payment proof could not be submitted." }, { status: 500 });
  }
}
