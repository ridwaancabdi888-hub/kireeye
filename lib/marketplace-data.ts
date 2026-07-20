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

const fallbackVehicles: MarketplaceVehicle[] = [
  { id: "toyota-one-ten", name: "Toyota Land Cruiser One Ten", category: "4x4", price_day: 95, rating: 4.9, locations: { name: "Hargeysa", city: "Hargeysa" }, vehicle_images: [] },
  { id: "toyota-noah", name: "Toyota Noah", category: "Minivan", price_day: 55, rating: 4.8, locations: { name: "Muqdisho", city: "Muqdisho" }, vehicle_images: [] },
  { id: "toyota-surf-2tr", name: "Toyota Surf 2TR", category: "SUV", price_day: 70, rating: 4.7, locations: { name: "Hargeysa Airport", city: "Hargeysa" }, vehicle_images: [] },
  { id: "toyota-prado", name: "Toyota Prado", category: "SUV", price_day: 85, rating: 4.8, locations: { name: "Muqdisho Airport", city: "Muqdisho" }, vehicle_images: [] },
];

export async function getAvailableVehicles(): Promise<MarketplaceVehicle[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return fallbackVehicles;

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await supabase
    .from("vehicles")
    .select("id,name,category,price_day,rating,locations(name,city),vehicle_images(public_url,sort_order)")
    .eq("status", "available")
    .order("featured", { ascending: false })
    .order("booking_count", { ascending: false })
    .limit(24);

  if (error || !data?.length) return fallbackVehicles;
  return data as unknown as MarketplaceVehicle[];
}

export async function getVehicleById(id: string): Promise<MarketplaceVehicle | null> {
  const vehicles = await getAvailableVehicles();
  return vehicles.find((vehicle) => vehicle.id === id) ?? vehicles[0] ?? null;
}
