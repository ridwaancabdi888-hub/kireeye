import Link from "next/link";
import { Navbar } from "@/components/Navbar";

export default function NotFound() {
  return <><Navbar/><main className="section"><div className="container empty-state"><span className="eyebrow">404</span><h1 className="details-title">Boggan lama helin</h1><p className="lead">URL-ka hubi ama ku noqo marketplace-ka si aad u raadiso gaadhi la heli karo.</p><div className="actions"><Link className="btn btn-primary" href="/vehicles">Raadi gaadhi</Link><Link className="btn btn-secondary" href="/">Ku noqo bogga hore</Link></div></div></main></>;
}
