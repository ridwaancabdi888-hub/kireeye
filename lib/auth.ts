import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase environment variables are missing.");
  }

  return createBrowserClient(url, key);
}

export function dashboardForRole(role?: string | null) {
  switch (role) {
    case "super_admin":
    case "platform_admin":
      return "/admin";
    case "company_owner":
    case "company_employee":
    case "car_owner":
      return "/company";
    default:
      return "/customer";
  }
}
