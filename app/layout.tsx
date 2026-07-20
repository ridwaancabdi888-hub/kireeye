import type { Metadata, Viewport } from "next";
import { PWARegister } from "@/components/PWARegister";
import "./globals.css";
import "./phase2.css";
import "./phase3.css";
import "./mobile.css";
import "./image-tools.css";

export const metadata: Metadata = {
  title: {
    default: "Kireeye — Gaadhiga saxda ah, goob kasta, goor kasta",
    template: "%s | Kireeye",
  },
  description: "Somaliland iyo Soomaaliya ka kireyso gaadhi la hubo, darawal leh ama darawal la'aan.",
  applicationName: "Kireeye",
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
      <body>{children}<PWARegister/></body>
    </html>
  );
}
