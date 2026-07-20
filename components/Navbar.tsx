import Link from "next/link";

export function Navbar() {
  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link className="logo" href="/"><span className="logo-mark">K</span>Kireeye</Link>
        <nav className="nav-links">
          <Link href="/vehicles">Gaadiid</Link><a href="#cities">Magaalooyin</a><a href="#partners">Shirkadaha</a><a href="#about">Nagu saabsan</a>
        </nav>
        <div className="actions"><button className="btn btn-secondary">Soo gal</button><button className="btn btn-primary">Isdiiwaangeli</button></div>
      </div>
    </header>
  );
}
