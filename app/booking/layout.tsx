import type { ReactNode } from "react";
import { utilityMetadata } from "@/lib/seo";

export const metadata = utilityMetadata;

export default function BookingLayout({ children }: { children: ReactNode }) {
  return children;
}
