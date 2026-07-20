import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Kireeye — Vehicle Rental Marketplace",
    short_name: "Kireeye",
    description: "Gaadhiga saxda ah, goob kasta, goor kasta.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f6f8fb",
    theme_color: "#0c7a5a",
    categories: ["travel", "business", "transportation"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Raadi gaadhi",
        short_name: "Gaadiid",
        url: "/vehicles",
        icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
      },
      {
        name: "Bookings-kayga",
        short_name: "Bookings",
        url: "/customer/bookings",
        icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
      },
    ],
  };
}
