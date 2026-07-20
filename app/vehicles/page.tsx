import { Navbar } from "@/components/Navbar";
import { VehicleCard } from "@/components/VehicleCard";
import { getAvailableVehicles } from "@/lib/marketplace-data";

export const revalidate = 60;

export default async function VehiclesPage() {
  const vehicles = await getAvailableVehicles();

  return <><Navbar/><main className="section"><div className="container">
    <span className="eyebrow">Search results</span>
    <div className="section-head"><div><h1 style={{ fontSize: 48 }}>Gaadiid diyaar ah</h1><p className="muted">Live listings-ka shirkadaha iyo milkiilayaasha la ansixiyey.</p></div><span className="badge">{vehicles.length} gaadhi</span></div>
    <div className="grid-3">{vehicles.map((vehicle) => {
      const firstImage = [...(vehicle.vehicle_images || [])].sort((a,b)=>(a.sort_order || 0)-(b.sort_order || 0))[0]?.public_url;
      return <VehicleCard
        key={vehicle.id}
        id={vehicle.id}
        name={vehicle.name}
        category={vehicle.category || "Vehicle"}
        price={Number(vehicle.price_day || 0)}
        imageUrl={firstImage}
        location={vehicle.locations?.name || vehicle.locations?.city || "Somalia"}
        rating={Number(vehicle.rating || 0).toFixed(1)}
      />;
    })}</div>
  </div></main></>;
}
