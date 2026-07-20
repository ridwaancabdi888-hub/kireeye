import { NextResponse } from "next/server";
import { getManagedCompany, getPrimaryRole, isPlatformAdmin } from "@/lib/access-control";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase-server";

const categories = new Set(["4x4","SUV","Sedan","Hatchback","Minivan","Minibus","Bus","Pickup","Luxury","Cargo","Construction"]);
const transmissions = new Set(["Automatic","Manual"]);

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const admin = createSupabaseAdminClient();
    if (!supabase || !admin) return NextResponse.json({ error: "Supabase configuration is missing." }, { status: 503 });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = await getPrimaryRole(admin, user.id);
    const managedCompany = await getManagedCompany(admin, user.id, "vehicles.manage");
    const adminAccess = await isPlatformAdmin(admin, user.id);
    if (!managedCompany && role !== "car_owner" && !adminAccess) return NextResponse.json({ error: role === "company_owner" ? "Complete your company profile before adding vehicles." : "You do not have vehicles.manage permission." }, { status: 403 });

    const body = await request.json();
    const required = ["name","make","model","year","seats","priceDay"];
    if (required.some(key => !body[key])) return NextResponse.json({ error: "Required vehicle information is missing." }, { status: 400 });

    const category = categories.has(String(body.category)) ? String(body.category) : "SUV";
    const transmission = transmissions.has(String(body.transmission)) ? String(body.transmission) : "Automatic";
    const payload = {
      company_id: managedCompany?.id || null,
      owner_id: managedCompany?.owner_id || user.id,
      name: String(body.name).trim(),
      make: String(body.make).trim(),
      model: String(body.model).trim(),
      year: Math.min(new Date().getFullYear() + 1, Math.max(1980, Number(body.year))),
      category,
      transmission,
      seats: Math.min(80, Math.max(1, Number(body.seats))),
      driver_available: Boolean(body.driverAvailable),
      self_drive_allowed: Boolean(body.selfDriveAllowed),
      intercity_allowed: Boolean(body.intercityAllowed),
      price_hour: Math.max(0, Number(body.priceHour || 0)),
      price_day: Math.max(0, Number(body.priceDay || 0)),
      price_week: Math.max(0, Number(body.priceWeek || 0)),
      price_month: Math.max(0, Number(body.priceMonth || 0)),
      description: String(body.description || "").trim(),
      deposit_amount: Math.max(0, Number(body.depositAmount || 0)),
      fuel_type: String(body.fuelType || "Petrol"),
      plate_number: String(body.plateNumber || "").trim(),
      status: "pending_approval",
    };
    if (payload.price_day <= 0) return NextResponse.json({ error: "Daily price must be greater than zero." }, { status: 400 });

    const { data: vehicle, error } = await admin.from("vehicles").insert(payload).select("id,status").single();
    if (error) throw error;
    await admin.from("audit_logs").insert({ actor_id: user.id, action: "vehicle.created", entity_type: "vehicle", entity_id: vehicle.id, metadata: { company_id: payload.company_id, name: payload.name } });

    return NextResponse.json({ vehicleId: vehicle.id, status: vehicle.status });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Vehicle could not be created." }, { status: 500 });
  }
}
