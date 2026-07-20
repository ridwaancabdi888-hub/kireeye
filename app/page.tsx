import { Navbar } from "@/components/Navbar";
import { VehicleCard } from "@/components/VehicleCard";

const vehicles = [
  { name:"Toyota Land Cruiser One Ten", category:"4x4", price:95, icon:"🚙", location:"Hargeysa", rating:"4.9" },
  { name:"Toyota Noah", category:"Minivan", price:55, icon:"🚐", location:"Muqdisho", rating:"4.8" },
  { name:"Toyota Surf 2TR", category:"SUV", price:70, icon:"🚙", location:"Hargeysa Airport", rating:"4.7" },
];

export default function HomePage(){return <><Navbar/><main>
<section className="hero"><div className="container"><div className="hero-grid"><div><span className="eyebrow">Somaliland & Soomaaliya</span><h1>Gaadhiga saxda ah, goob kasta, goor kasta.</h1><p className="lead">Ka hel gaadhi la hubo Hargeysa, Muqdisho iyo garoomada diyaaradaha. Dooro darawal leh ama darawal la’aan, saacad, maalin ama safar magaalo kale.</p></div><div className="hero-card"><span className="badge">Verified marketplace</span><h2>Safarkaaga ka bilow kalsooni.</h2><div className="hero-car">🚙</div><div className="hero-stat"><strong>250+</strong><br/><span>Gaadiid la xaqiijiyey</span></div></div></div>
<form className="search"><div className="field"><label>Goobta laga qaadanayo</label><select><option>Hargeysa</option><option>Muqdisho</option><option>Hargeysa Airport</option><option>Muqdisho Airport</option></select></div><div className="field"><label>Taariikhda qaadashada</label><input type="date"/></div><div className="field"><label>Taariikhda celinta</label><input type="date"/></div><div className="field"><label>Nooca kirada</label><select><option>Maalinle</option><option>Saacadle</option><option>Safar magaalo kale</option><option>Airport pickup</option></select></div><button className="btn btn-primary" type="button">Raadi gaadhi</button></form></div></section>
<section className="section"><div className="container"><div className="section-head"><div><span className="eyebrow">Ugu caansan</span><h2>Gaadiidka loogu kiraysiga badan yahay</h2></div><a className="muted" href="/vehicles">Dhammaan eeg →</a></div><div className="grid-3">{vehicles.map(v=><VehicleCard key={v.name} {...v}/>)}</div></div></section>
<section className="section" id="cities"><div className="container"><div className="section-head"><div><span className="eyebrow">Goobaha</span><h2>Ka raadi magaaladaada</h2></div></div><div className="city-grid">{["Hargeysa","Muqdisho","Hargeysa Airport","Muqdisho Airport"].map((city,i)=><div className="city" key={city}><span>{i>1?"✈️":"🏙️"}</span><h3>{city}</h3><span>Gaadiid diyaar ah →</span></div>)}</div></div></section>
</main><footer className="footer"><div className="container footer-grid"><div><div className="logo"><span className="logo-mark">K</span>Kireeye</div><p>Gaadhiga saxda ah, goob kasta, goor kasta.</p><p>WhatsApp: +252 63 4199277<br/>Email: ridwaancabdi888@gmail.com</p></div></div></footer></>}
