import type { ReactNode } from "react";
import { utilityMetadata } from "@/lib/seo";

export const metadata = utilityMetadata;

export default function SigninLayout({ children }: { children: ReactNode }) {
  return children;
}
