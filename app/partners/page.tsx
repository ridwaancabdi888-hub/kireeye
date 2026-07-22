import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata({
  title: "Rental Companies iyo Vehicle Partners",
  description: "Baro qalabka Kireeye ee rental companies iyo milkiilayaasha gaadiidka, kadibna nala soo xiriir si partnership loo xaqiijiyo.",
  path: "/partners",
});

export default function PartnersPage(){return <><Navbar/><main><section className="hero"><div className="container"><div className="hero-grid"><div><span className="eyebrow">Kireeye Partner Network</span><h1>Gaadiidkaaga ka dhig ganacsi si nidaamsan u shaqeeya.</h1><p className="lead">Shirkad ama milkiile gaadhi ahaan ku soo biir, gaadiidka geli, qiimaha deji, bookings maamul, shaqaale samee, kadibna earnings-ka dashboard-ka kala soco.</p><div className="actions"><Link className="btn btn-primary" href="/contact">Codso partnership</Link><Link className="btn btn-secondary" href="/signin">Partner hore? Soo gal</Link></div></div><div className="hero-card"><span className="badge">Company tools</span><h2>Hal dashboard oo lagu maamulo dhammaan rental operations.</h2><div className="hero-stat"><strong>Roles & Permissions</strong><br/><span>Owner-ku shaqaalaha ayuu awood gaar ah siin karaa.</span></div></div></div></div></section><section className="section"><div className="container"><div className="grid-3">{[["🚙","Vehicle management","Sawirro, pricing, availability, maintenance iyo approval."],["📅","Booking operations","Accept, reject, pickup, complete iyo booking calendar."],["👥","Employee permissions","Booking Agent, Accountant, Vehicle Manager iyo Branch Manager."],["💳","Payments & earnings","Revenue, commission, net earnings iyo payment records."],["⭐","Reviews","Customer feedback iyo vehicle rating."],["📊","Analytics","Most rented cars, utilization, bookings iyo city performance."]].map(([icon,title,body])=><article className="card" key={title}><div style={{fontSize:40}}>{icon}</div><h2>{title}</h2><p className="muted">{body}</p></article>)}</div></div></section></main></>}
