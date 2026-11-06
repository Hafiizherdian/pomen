import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-token";

// 1. TAMBAHKAN 'async' DI SINI
export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login") return NextResponse.next();

  // 2. TAMBAHKAN 'await' DI SINI
  if (await verifySessionToken(request.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.next();
  }
  
  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export const config = {
  matcher: ["/admin/:path*"],
};