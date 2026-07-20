import { NextResponse } from "next/server";
import { canManageBooking } from "@/lib/access-control";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase-server";

const transitions: Record<string, string[]> = {
  pending: ["confirmed", "rejected"],
  awaiting_payment: ["rejected"],
  confirmed: ["in_progress", "rejected"],
  in_progress: ["completed", "disputed"],
  disputed: ["completed", "refunded"],
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createSupabaseServerClient();
    const admin = createSupabaseAdminClient();
    if (!supabase || !admin) return NextResponse.json({ error: "Supabase configuration is missing." }, { status: 503 });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!(await canManageBooking(admin, user.id, id, "bookings.manage"))) return NextResponse.json({ error: "You do not have permission to manage this booking." }, { status: 403 });

    const { data: booking } = await admin.from("bookings").select("id,status,vehicle_id").eq("id", id).maybeSingle();
    if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });

    const body = await request.json();
    const nextStatus = String(body.status || "");
    if (!transitions[booking.status]?.includes(nextStatus)) return NextResponse.json({ error: `Invalid status transition from ${booking.status} to ${nextStatus}.` }, { status: 409 });

    const { error } = await admin.from("bookings").update({ status: nextStatus }).eq("id", id);
    if (error) throw error;

    if (nextStatus === "in_progress") await admin.from("vehicles").update({ status: "rented" }).eq("id", booking.vehicle_id);
    if (["completed","rejected","refunded"].includes(nextStatus)) await admin.from("vehicles").update({ status: "available" }).eq("id", booking.vehicle_id);

    await admin.from("audit_logs").insert({ actor_id: user.id, action: "booking.status_changed", entity_type: "booking", entity_id: id, metadata: { from: booking.status, to: nextStatus } });

    return NextResponse.json({ success: true, status: nextStatus });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Booking status could not be updated." }, { status: 500 });
  }
}
