import Link from "next/link";

export type VehicleCardProps = {
  id?: string;
  name: string;
  category: string;
  price: number;
  icon?: string;
  imageUrl?: string | null;
  location: string;
  rating: string;
};

export function VehicleCard({ id, name, category, price, icon = "🚙", imageUrl, location, rating }: VehicleCardProps) {
  const slug = id || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return <article className="card">
    <div className="car-cover">
      {imageUrl ? <img className="vehicle-image" src={imageUrl} alt={name} /> : icon}
    </div>
    <div style={{ marginTop: 16 }} className="row"><span className="badge">{category}</span><span>★ {rating}</span></div>
    <h3 style={{ fontSize: 22, marginBottom: 4 }}>{name}</h3>
    <p className="muted">📍 {location} · Automatic · AC</p>
    <div className="row"><div><span className="price">${price}</span><span className="muted"> / maalintii</span></div><Link className="btn btn-primary" href={`/vehicles/${slug}`}>Kirayso</Link></div>
  </article>;
}
