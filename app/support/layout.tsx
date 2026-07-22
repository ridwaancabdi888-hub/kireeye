import type { ReactNode } from "react";
import { utilityMetadata } from "@/lib/seo";

export const metadata = utilityMetadata;

export default function SupportLayout({ children }: { children: ReactNode }) {
  return children;
}
