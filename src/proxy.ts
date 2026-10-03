import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const pathname = request.nextUrl.pathname;
  const isPublicRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/invite") ||
    pathname.startsWith("/api/ical") ||
    pathname.startsWith("/api/export") ||
    pathname.startsWith("/manifest") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/favicon.ico");

  // Check omah_session cookie (testing account & local session)
  const omahSession = request.cookies.get("omah_session")?.value;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let hasSupabaseUser = false;

  // If supabase is configured with real key, check Supabase session
  if (supabaseUrl && supabaseAnonKey && supabaseAnonKey !== "placeholder-anon-key") {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) hasSupabaseUser = true;
  }

  const isAuthenticated = Boolean(omahSession || hasSupabaseUser);

  if (!isAuthenticated && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isAuthenticated && pathname.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
