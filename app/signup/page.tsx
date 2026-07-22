import { redirect } from "next/navigation";
import { utilityMetadata } from "@/lib/seo";

export const metadata = utilityMetadata;

/**
 * Public self-registration is disabled. Accounts are created only by the Super
 * Admin (company admins) and by company admins (their own company's users).
 * Anyone landing on /signup is sent to the login page.
 */
export default function SignupPage() {
  redirect("/signin");
}
