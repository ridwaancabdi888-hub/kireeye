import { Navbar } from "@/components/Navbar";
import { VehicleCard } from "@/components/VehicleCard";
import { getAvailableVehicles } from "@/lib/marketplace-data";

export const revalidate = 60;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function VehiclesPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const location = typeof query.location === "string" ? query.location : "";
  const category = typeof query.category === "string" ? query.category : "";
  const maxPrice = typeof query.maxPrice === "string" ? Number(query.maxPrice) : 0;
  const sort = typeof query.sort === "string" ? query.sort : "recommended";

  let vehicles = await getAvailableVehicles();
  if (location) vehicles = vehicles.filter(vehicle => `${vehicle.locations?.name || ""} ${vehicle.locations?.city || ""}`.toLowerCase().includes(location.toLowerCase()));
  if (category) vehicles = vehicles.filter(vehicle => (vehicle.category || "").toLowerCase() === category.toLowerCase());
  if (maxPrice > 0) vehicles = vehicles.filter(vehicle => Number(vehicle.price_day || 0) <= maxPrice);

  vehicles = [...vehicles].sort((a,b) => {
    if (sort === "price-low") return Number(a.price_day || 0) - Number(b.price_day || 0);
    if (sort === "price-high") return Number(b.price_day || 0) - Number(a.price_day || 0);
    if (sort === "rating") return Number(b.rating || 0) - Number(a.rating || 0);
    return Number(b.rating || 0) - Number(a.rating || 0);
  });

  return <><Navbar/><main className="section"><div className="container">
    <span className="eyebrow">Search results</span>
    <div className="section-head"><div><h1 style={{ fontSize: 48 }}>Gaadiid diyaar ah</h1><p className="muted">Live listings-ka shirkadaha iyo milkiilayaasha la ansixiyey.</p></div><span className="badge">{vehicles.length} gaadhi</span></div>
    <div className="marketplace-layout"><aside className="card filter-panel"><h2>Filters</h2><form className="auth-form" method="get"><div className="field"><label>Magaalada</label><select name="location" defaultValue={location}><option value="">Dhammaan</option><option>Hargeysa</option><option>Muqdisho</option><option>Hargeysa Airport</option><option>Muqdisho Airport</option></select></div><div className="field"><label>Category</label><select name="category" defaultValue={category}><option value="">Dhammaan</option><option>4x4</option><option>SUV</option><option>Sedan</option><option>Minivan</option><option>Pickup</option><option>Luxury</option></select></div><div className="field"><label>Qiimaha ugu badan / maalintii</label><input name="maxPrice" type="number" defaultValue={maxPrice || ""} placeholder="100"/></div><div className="field"><label>Sort</label><select name="sort" defaultValue={sort}><option value="recommended">Recommended</option><option value="price-low">Lowest price</option><option value="price-high">Highest price</option><option value="rating">Highest rating</option></select></div><button className="btn btn-primary">Apply filters</button></form></aside><section><div className="grid-3 vehicle-results">{vehicles.map((vehicle) => {
      const firstImage = [...(vehicle.vehicle_images || [])].sort((a,b)=>(a.sort_order || 0)-(b.sort_order || 0))[0]?.public_url;
      return <VehicleCard key={vehicle.id} id={vehicle.id} name={vehicle.name} category={vehicle.category || "Vehicle"} price={Number(vehicle.price_day || 0)} imageUrl={firstImage} location={vehicle.locations?.name || vehicle.locations?.city || "Somalia"} rating={Number(vehicle.rating || 0).toFixed(1)}/>;
    })}</div>{!vehicles.length&&<div className="card empty-state"><h2>Gaadhi ku habboon lama helin</h2><p>Filters-ka beddel ama magaalo kale dooro.</p></div>}</section></div>
  </div></main></>;
}
