import type { SupabaseClient } from "@supabase/supabase-js";

const adminRoles = new Set(["super_admin", "platform_admin"]);

export async function getPrimaryRole(admin: SupabaseClient, userId: string): Promise<string> {
  const { data } = await admin.from("user_roles").select("role").eq("user_id", userId).limit(1).maybeSingle();
  return data?.role || "customer";
}

export async function isPlatformAdmin(admin: SupabaseClient, userId: string): Promise<boolean> {
  return adminRoles.has(await getPrimaryRole(admin, userId));
}

export async function getManagedCompany(admin: SupabaseClient, userId: string, permission?: string): Promise<{ id:string; owner_id:string } | null> {
  const { data: owned } = await admin.from("companies").select("id,owner_id").eq("owner_id", userId).limit(1).maybeSingle();
  if (owned) return owned;

  const { data: employee } = await admin.from("company_employees").select("company_id,active,permissions,companies(owner_id)").eq("user_id", userId).eq("active", true).limit(1).maybeSingle();
  if (!employee) return null;
  if (permission && !employee.permissions?.[permission]) return null;
  const company = employee.companies as unknown as { owner_id?: string } | null;
  return company?.owner_id ? { id: employee.company_id, owner_id: company.owner_id } : null;
}

export async function canManageBooking(admin: SupabaseClient, userId: string, bookingId: string, permission = "bookings.manage") {
  if (await isPlatformAdmin(admin, userId)) return true;
  const { data: booking } = await admin.from("bookings").select("vehicle_id,vehicles(owner_id,company_id,companies(owner_id))").eq("id", bookingId).maybeSingle();
  if (!booking) return false;

  const vehicle = booking.vehicles as unknown as { owner_id?: string; company_id?: string; companies?: { owner_id?: string } | null } | null;
  if (!vehicle) return false;
  if (vehicle.owner_id === userId || vehicle.companies?.owner_id === userId) return true;
  if (!vehicle.company_id) return false;

  const { data: employee } = await admin.from("company_employees").select("active,permissions").eq("company_id", vehicle.company_id).eq("user_id", userId).maybeSingle();
  return Boolean(employee?.active && employee.permissions?.[permission]);
}

export async function canManageVehicle(admin: SupabaseClient, userId: string, vehicleId: string, permission = "vehicles.manage") {
  if (await isPlatformAdmin(admin, userId)) return true;
  const { data: vehicle } = await admin.from("vehicles").select("owner_id,company_id,companies(owner_id)").eq("id", vehicleId).maybeSingle();
  if (!vehicle) return false;
  const company = vehicle.companies as unknown as { owner_id?: string } | null;
  if (vehicle.owner_id === userId || company?.owner_id === userId) return true;
  if (!vehicle.company_id) return false;

  const { data: employee } = await admin.from("company_employees").select("active,permissions").eq("company_id", vehicle.company_id).eq("user_id", userId).maybeSingle();
  return Boolean(employee?.active && employee.permissions?.[permission]);
}
