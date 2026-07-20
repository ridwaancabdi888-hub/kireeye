import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { getLocale, publicTranslations } from "@/lib/i18n";

export async function Navbar() {
  const locale = await getLocale();
  const t = publicTranslations[locale];

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link className="logo" href="/"><span className="logo-mark">K</span>Kireeye</Link>
        <nav className="nav-links">
          <Link href="/vehicles">{t.vehicles}</Link><a href="/#cities">{t.cities}</a><Link href="/partners">{t.partners}</Link><Link href="/about">{t.about}</Link>
        </nav>
        <div className="actions"><LanguageSwitcher/><Link className="btn btn-secondary" href="/signin">{t.signin}</Link><Link className="btn btn-primary" href="/signup">{t.signup}</Link></div>
      </div>
    </header>
  );
}
