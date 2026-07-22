import { createClient } from "@supabase/supabase-js";

export type MarketplaceVehicle = {
  id: string;
  name: string;
  category: string | null;
  price_day: number | null;
  rating: number | null;
  locations: { name: string; city: string } | null;
  vehicle_images: { public_url: string | null; sort_order: number | null }[];
};

export async function getAvailableVehicles(): Promise<MarketplaceVehicle[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await supabase
    .from("vehicles")
    .select("id,name,category,price_day,rating,locations(name,city),vehicle_images(public_url,sort_order)")
    .eq("status", "available")
    .order("featured", { ascending: false })
    .order("booking_count", { ascending: false })
    .limit(24);

  if (error || !data?.length) return [];
  return data as unknown as MarketplaceVehicle[];
}

export async function getVehicleById(id: string): Promise<MarketplaceVehicle | null> {
  const vehicles = await getAvailableVehicles();
  return vehicles.find((vehicle) => vehicle.id === id) ?? null;
}
