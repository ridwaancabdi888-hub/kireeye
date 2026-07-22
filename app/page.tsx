import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { VehicleCard } from "@/components/VehicleCard";
import { getLocale, publicTranslations } from "@/lib/i18n";
import { getAvailableVehicles } from "@/lib/marketplace-data";
import { SITE_URL } from "@/lib/site";

export const revalidate = 60;

const title = "Kireeye | Kirada Gaadiidka Somaliland iyo Soomaaliya";
const description = "Ka raadi gaadiid kiro ah Hargeysa, Muqdisho iyo garoomada diyaaradaha adigoo isticmaalaya marketplace-ka Kireeye.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/" },
  openGraph: { type: "website", url: "/", title, description, siteName: "Kireeye", locale: "so_SO" },
  twitter: { card: "summary", title, description },
  robots: { index: true, follow: true },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: `${SITE_URL}/`, name: "Kireeye", description, inLanguage: "so" },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Kireeye",
      url: `${SITE_URL}/`,
      email: "ridwaancabdi888@gmail.com",
      telephone: "+252634199277",
      areaServed: ["Somaliland", "Somalia"],
    },
  ],
};

export default async function HomePage(){
  const locale=await getLocale();const t=publicTranslations[locale];const availableVehicles=await getAvailableVehicles();const vehicles=availableVehicles.slice(0,3);
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structuredData).replace(/</g,"\\u003c")}}/><Navbar/><main>
    <section className="hero"><div className="container"><div className="hero-grid"><div><span className="eyebrow">{t.region}</span><h1>{t.hero}</h1><p className="lead">{t.heroBody}</p></div><div className="hero-card"><span className="badge">{t.verified}</span><h2>{t.trust}</h2><div className="hero-car">🚙</div><div className="hero-stat"><strong>{availableVehicles.length || "—"}</strong><br/><span>{t.available}</span></div></div></div>
      <form className="search" action="/vehicles"><div className="field"><label>{t.pickup}</label><select name="location"><option>Hargeysa</option><option>Muqdisho</option><option>Hargeysa Airport</option><option>Muqdisho Airport</option></select></div><div className="field"><label>{t.pickupDate}</label><input name="pickup" type="date"/></div><div className="field"><label>{t.returnDate}</label><input name="return" type="date"/></div><div className="field"><label>{t.rentalType}</label><select name="type"><option value="daily">{t.daily}</option><option value="hourly">{t.hourly}</option><option value="intercity">{t.intercity}</option><option value="airport">{t.airport}</option></select></div><button className="btn btn-primary" type="submit">{t.search}</button></form>
    </div></section>
    <section className="section"><div className="container"><div className="section-head"><div><span className="eyebrow">{t.popular}</span><h2>{t.mostRented}</h2></div><Link className="muted" href="/vehicles">{t.viewAll} →</Link></div>{vehicles.length?<div className="grid-3">{vehicles.map(vehicle=>{const image=[...(vehicle.vehicle_images||[])].sort((a,b)=>(a.sort_order||0)-(b.sort_order||0))[0]?.public_url;return <VehicleCard key={vehicle.id} id={vehicle.id} name={vehicle.name} category={vehicle.category||"Vehicle"} price={Number(vehicle.price_day||0)} imageUrl={image} location={vehicle.locations?.name||vehicle.locations?.city||"Somalia"} rating={Number(vehicle.rating||0).toFixed(1)}/>})}</div>:<div className="card empty-state"><h3>Gaadiid public ah hadda lama soo bandhigin</h3><p>Marka listings la ansixiyo halkan ayay ka muuqan doonaan. Wixii faahfaahin ah, la xiriir Kireeye.</p><Link className="btn btn-secondary" href="/contact">Nala soo xiriir</Link></div>}</div></section>
    <section className="section" id="cities"><div className="container"><div className="section-head"><div><span className="eyebrow">{t.locations}</span><h2>{t.chooseCity}</h2></div></div><div className="city-grid">{["Hargeysa","Muqdisho","Hargeysa Airport","Muqdisho Airport"].map((city,index)=><Link className="city" href={`/vehicles?location=${encodeURIComponent(city)}`} key={city}><span>{index>1?"✈️":"🏙️"}</span><h3>{city}</h3><span>{t.available} →</span></Link>)}</div></div></section>
  </main><footer className="footer"><div className="container footer-grid"><div><div className="logo"><span className="logo-mark">K</span>Kireeye</div><p>{t.hero}</p><p>WhatsApp: +252 63 4199277<br/>Email: ridwaancabdi888@gmail.com</p></div><div><strong>{t.vehicles}</strong><p><Link href="/vehicles">{t.available}</Link></p><p><Link href="/partners">{t.partners}</Link></p></div><div><strong>{t.about}</strong><p><Link href="/about">{t.about}</Link></p><p><Link href="/contact">Contact</Link></p></div><div><strong>Legal</strong><p><Link href="/terms">Terms</Link></p><p><Link href="/privacy">Privacy</Link></p></div></div></footer></>
}
