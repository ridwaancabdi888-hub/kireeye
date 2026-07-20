import { NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const admin = createSupabaseAdminClient();
    if (!supabase || !admin) return NextResponse.json({ error: "Supabase configuration is missing." }, { status: 503 });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: booking } = await admin.from("bookings").select("id,customer_id,status,pickup_at").eq("id", id).maybeSingle();
    if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    if (booking.customer_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!["pending","awaiting_payment","confirmed"].includes(booking.status)) return NextResponse.json({ error: "This booking can no longer be cancelled online." }, { status: 409 });

    const hoursUntilPickup = (new Date(booking.pickup_at).getTime() - Date.now()) / 3_600_000;
    const cancellationType = hoursUntilPickup >= 24 ? "free" : "late";
    const { error } = await admin.from("bookings").update({ status: "cancelled" }).eq("id", id);
    if (error) throw error;

    await admin.from("audit_logs").insert({ actor_id: user.id, action: "booking.cancelled", entity_type: "booking", entity_id: id, metadata: { cancellation_type: cancellationType, hours_until_pickup: Math.round(hoursUntilPickup) } });

    return NextResponse.json({ success: true, cancellationType });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Booking could not be cancelled." }, { status: 500 });
  }
}
