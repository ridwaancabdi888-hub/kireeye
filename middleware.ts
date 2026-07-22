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
  // Public self-registration is disabled platform-wide. Any /signup hit — logged
  // in or not, env configured or not — is redirected to the login page.
  if (request.nextUrl.pathname === "/signup") {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    // Fail closed: without Supabase configuration we cannot verify anyone,
    // so protected areas must not be reachable.
    const pathname = request.nextUrl.pathname;
    if (protectedRoutes.some((route) => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }
    return NextResponse.next();
  }

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
    // Roles come ONLY from the user_roles table. user_metadata is writable by
    // the user themselves and must never grant route access (privilege escalation).
    role = data?.role || "customer";
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
