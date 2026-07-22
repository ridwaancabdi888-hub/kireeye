import type { MetadataRoute } from "next";
import { getAvailableVehicles } from "@/lib/marketplace-data";
import { SITE_URL } from "@/lib/site";

const publicPages = ["", "/vehicles", "/about", "/partners", "/contact", "/cancellation", "/privacy", "/terms"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const vehicles = await getAvailableVehicles();
  const pages: MetadataRoute.Sitemap = publicPages.map((path) => ({
    url: `${SITE_URL}${path || "/"}`,
    changeFrequency: path === "" || path === "/vehicles" ? "daily" : "monthly",
    priority: path === "" ? 1 : path === "/vehicles" ? 0.9 : 0.6,
  }));
  const vehiclePages: MetadataRoute.Sitemap = vehicles.map((vehicle) => ({
    url: `${SITE_URL}/vehicles/${vehicle.id}`,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [...pages, ...vehiclePages];
}
