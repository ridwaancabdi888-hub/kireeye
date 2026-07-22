import type { Metadata, Viewport } from "next";
import { PWARegister } from "@/components/PWARegister";
import { SITE_URL } from "@/lib/site";
import "./globals.css";
import "./phase2.css";
import "./phase3.css";
import "./mobile.css";
import "./dashboard-mobile-menu.css";
import "./image-tools.css";
import "./design-system.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Kireeye | Kirada Gaadiidka Somaliland iyo Soomaaliya",
    template: "%s | Kireeye",
  },
  description: "Ka raadi gaadiid kiro ah Hargeysa, Muqdisho iyo garoomada diyaaradaha adigoo isticmaalaya marketplace-ka Kireeye.",
  applicationName: "Kireeye",
  creator: "Kireeye",
  publisher: "Kireeye",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  appleWebApp: { capable: true, title: "Kireeye", statusBarStyle: "default" },
  formatDetection: { telephone: true },
};

export const viewport: Viewport = {
  themeColor: "#0c7a5a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="so">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}<PWARegister/></body>
    </html>
  );
}
