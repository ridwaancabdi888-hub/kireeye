import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { getVehicleById } from "@/lib/marketplace-data";
import { SITE_URL } from "@/lib/site";

type VehiclePageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: VehiclePageProps): Promise<Metadata> {
  const { id } = await params;
  const vehicle = await getVehicleById(id);

  if (!vehicle) {
    return {
      title: "Gaadhi lama helin",
      robots: { index: false, follow: true },
    };
  }

  const location = vehicle.locations?.name || vehicle.locations?.city || "Somalia";
  const description = `${vehicle.name} ka eeg Kireeye: ${vehicle.category || "gaadhi"} laga heli karo ${location}. Hubi qiimaha iyo availability-ga ka hor booking-ka.`;
  const image = [...(vehicle.vehicle_images || [])].sort((a,b)=>(a.sort_order||0)-(b.sort_order||0))[0]?.public_url;

  return {
    title: `${vehicle.name} Kiro — ${location}`,
    description,
    alternates: { canonical: `/vehicles/${vehicle.id}` },
    openGraph: {
      type: "website",
      url: `/vehicles/${vehicle.id}`,
      title: `${vehicle.name} Kiro | Kireeye`,
      description,
      siteName: "Kireeye",
      images: image ? [{ url: image, alt: `${vehicle.name} rental vehicle` }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: `${vehicle.name} Kiro | Kireeye`,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function VehicleDetails({ params }: VehiclePageProps) {
  const { id } = await params;
  const vehicle = await getVehicleById(id);

  if (!vehicle) notFound();

  const images = [...(vehicle.vehicle_images || [])].sort((a,b)=>(a.sort_order || 0)-(b.sort_order || 0));
  const location = vehicle.locations?.name || vehicle.locations?.city || "Somalia";
  const price = Number(vehicle.price_day || 0);
  const rating = Number(vehicle.rating || 0);
  const schema = {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    "@id": `${SITE_URL}/vehicles/${vehicle.id}#vehicle`,
    name: vehicle.name,
    url: `${SITE_URL}/vehicles/${vehicle.id}`,
    image: images.map((image) => image.public_url).filter(Boolean),
    vehicleConfiguration: vehicle.category || undefined,
    offers: price > 0 ? {
      "@type": "Offer",
      url: `${SITE_URL}/vehicles/${vehicle.id}`,
      priceCurrency: "USD",
      price,
      availability: "https://schema.org/InStock",
    } : undefined,
  };

  return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,"\\u003c")}}/><Navbar/><main className="section"><div className="container"><div className="details-grid"><section>
    <div className="vehicle-gallery">{images[0]?.public_url ? <img className="vehicle-detail-image" src={images[0].public_url} alt={`${vehicle.name} rental vehicle`} fetchPriority="high"/> : "🚙"}</div>
    <div className="row"><div><span className="badge">{vehicle.category || "Vehicle"}</span><h1 className="details-title">{vehicle.name}</h1><p className="muted">{location}{rating>0?` · ★ ${rating.toFixed(1)}`:" · Qiimayn wali ma leh"}</p></div><div>{price>0?<><strong className="price">${price}</strong><span className="muted"> / maalintii</span></>:<strong>Qiimaha weydii</strong>}</div></div>
    <div className="card"><h2>Xogta listing-ka</h2><div className="feature-grid"><span>📍 {location}</span><span>🚙 {vehicle.category || "Vehicle"}</span>{price>0&&<span>💵 ${price} / maalintii</span>}</div></div>
    <div className="card"><h2>Ka hor booking-ka</h2><p className="muted">Provider-ka ka xaqiiji availability-ga, darawal ama self-drive, transmission-ka, AC-ga, insurance-ka, deposit-ka iyo cancellation policy-ga. Kireeye ma qiyaaso xog aan listing-ka laga xaqiijin.</p></div>
  </section><aside className="booking-card"><h2>Book garee gaadhigan</h2><div className="field"><label>Pickup</label><select><option>{location}</option><option>Hargeysa Airport</option><option>Muqdisho Airport</option></select></div><div className="field"><label>Pickup date</label><input type="datetime-local"/></div><div className="field"><label>Return date</label><input type="datetime-local"/></div><div className="field"><label>Habka kirada</label><select><option>Maalinle</option><option>Saacadle</option><option>Safar magaalo kale</option></select></div><Link className="btn btn-primary auth-submit" href={`/booking?vehicle=${vehicle.id}`}>Sii wad booking-ka</Link></aside></div></div></main></>;
}
