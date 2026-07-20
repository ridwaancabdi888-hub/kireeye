import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { getVehicleById } from "@/lib/marketplace-data";

export default async function VehicleDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vehicle = await getVehicleById(id);

  if (!vehicle) return <><Navbar/><main className="section"><div className="container"><h1>Gaadhigan lama helin</h1><Link className="btn btn-primary" href="/vehicles">Ku noqo gaadiidka</Link></div></main></>;

  const images = [...(vehicle.vehicle_images || [])].sort((a,b)=>(a.sort_order || 0)-(b.sort_order || 0));
  const location = vehicle.locations?.name || vehicle.locations?.city || "Somalia";
  const price = Number(vehicle.price_day || 0);

  return <><Navbar/><main className="section"><div className="container"><div className="details-grid"><section>
    <div className="vehicle-gallery">{images[0]?.public_url ? <img className="vehicle-detail-image" src={images[0].public_url} alt={vehicle.name}/> : "🚙"}</div>
    <div className="row"><div><span className="badge">Verified {vehicle.category || "Vehicle"}</span><h1 className="details-title">{vehicle.name}</h1><p className="muted">{location} · Automatic · AC · ★ {Number(vehicle.rating || 0).toFixed(1)}</p></div><div><strong className="price">${price}</strong><span className="muted"> / maalintii</span></div></div>
    <div className="card"><h2>Faahfaahinta gaadhiga</h2><div className="feature-grid">{["Darawal waa la heli karaa","Self-drive waa la oggol yahay","Safar magaalo kale","Free cancellation 24 saac","Insurance verified","Airport pickup"].map(x=><span key={x}>✓ {x}</span>)}</div></div>
    <div className="card"><h2>Shuruudaha</h2><p className="muted">Self-drive booking wuxuu u baahan yahay aqoonsi sax ah, driving licence iyo deposit. Shirkaddu waxay xaqiijinaysaa dukumentiyada ka hor pickup-ka.</p></div>
  </section><aside className="booking-card"><h2>Book garee gaadhigan</h2><div className="field"><label>Pickup</label><select><option>{location}</option><option>Hargeysa Airport</option><option>Muqdisho Airport</option></select></div><div className="field"><label>Pickup date</label><input type="datetime-local"/></div><div className="field"><label>Return date</label><input type="datetime-local"/></div><div className="field"><label>Habka kirada</label><select><option>Maalinle</option><option>Saacadle</option><option>Safar magaalo kale</option></select></div><Link className="btn btn-primary auth-submit" href={`/booking?vehicle=${vehicle.id}`}>Sii wad booking-ka</Link></aside></div></div></main></>;
}
