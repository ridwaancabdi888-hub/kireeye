import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

const protectedRoutes = ["/customer", "/company", "/admin"];
const adminRoles = new Set(["super_admin", "platform_admin"]);
const companyRoles = new Set(["company_owner", "company_employee", "car_owner"]);

function dashboardForRole(role?: string | null) {
  if (role && adminRoles.has(role)) return "/admin";
  if (role && companyRoles.has(role)) return "/company";
  return "/customer";
}

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (!user && isProtected) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/signin";
    redirect.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(redirect);
  }

  let role: string | null = null;
  if (user) {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    role = data?.role || user.user_metadata?.role || "customer";
  }

  if (user && pathname.startsWith("/admin") && !adminRoles.has(role || "")) {
    return NextResponse.redirect(new URL(dashboardForRole(role), request.url));
  }

  if (
    user &&
    pathname.startsWith("/company") &&
    !companyRoles.has(role || "") &&
    !adminRoles.has(role || "")
  ) {
    return NextResponse.redirect(new URL(dashboardForRole(role), request.url));
  }

  if (
    user &&
    pathname.startsWith("/customer") &&
    (adminRoles.has(role || "") || companyRoles.has(role || ""))
  ) {
    return NextResponse.redirect(new URL(dashboardForRole(role), request.url));
  }

  if (user && ["/signin", "/signup"].includes(pathname)) {
    return NextResponse.redirect(new URL(dashboardForRole(role), request.url));
  }

  return response;
}

export const config = {
  matcher: ["/customer/:path*", "/company/:path*", "/admin/:path*", "/signin", "/signup"],
};
