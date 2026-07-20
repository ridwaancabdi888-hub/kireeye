import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kireeye — Gaadhiga saxda ah, goob kasta, goor kasta",
  description: "Somaliland iyo Soomaaliya ka kireyso gaadhi la hubo, darawal leh ama darawal la'aan.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="so">
      <body>{children}</body>
    </html>
  );
}
