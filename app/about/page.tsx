import { Navbar } from "@/components/Navbar";
import { createPublicMetadata } from "@/lib/seo";

export const metadata = createPublicMetadata({
  title: "Nagu Saabsan",
  description: "Baro Kireeye, marketplace-ka isku xira dadka gaadhi kireysanaya iyo rental providers-ka Somaliland iyo Soomaaliya.",
  path: "/about",
});

export default function AboutPage(){return <><Navbar/><main className="section"><div className="container legal-content"><span className="eyebrow">About Kireeye</span><h1 className="details-title">Kirada gaadiidka Soomaalida oo hal meel lagu mideeyey.</h1><p className="lead">Kireeye waa marketplace isku xira customers, rental companies iyo milkiilayaasha gaadiidka ee Somaliland iyo Soomaaliya.</p><h2>Ujeeddadayada</h2><p>Waxaan doonaynaa in kirada gaadhigu noqoto mid fudud, la hubin karo, qiimaheedu cad yahay, isla markaana customer-ku ka raadin karo magaalooyinka iyo airports-ka ay listings-ku ka jiraan.</p><h2>Sida aan kalsoonida u ilaalino</h2><p>Companies, owners, vehicles iyo documents waxaa hubiya maamulka Kireeye. Payments, booking status, reviews iyo activity logs waxaa lagu kaydiyaa nidaamka si khilaafaadka loo xallin karo.</p><h2>Adeegyada</h2><p>Kirada saacadlaha ah, maalinlaha ah, toddobaadlaha ah, billaha ah, airport pickup, intercity travel, gaadhi darawal leh iyo self-drive.</p></div></main></>}
