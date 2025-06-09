import { NextResponse } from "next/server";

export function middleware(request) {
  const url = request.nextUrl.clone();
  // Proteger todas las rutas bajo /dashboard
  if (url.pathname.startsWith("/dashboard")) {
    // Verificar si el usuario está autenticado
    const session =
      request.cookies.get("next-auth.session-token") ||
      request.cookies.get("__Secure-next-auth.session-token");
    if (!session) {
      url.pathname = "/api/auth/signin";
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
