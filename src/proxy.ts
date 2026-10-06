import { NextRequest, NextResponse } from "next/server";

// Deploy the same repository as two Vercel projects. Keep the existing
// deployment working until SITE_MODE is explicitly configured.
export function proxy(request: NextRequest) {
  const mode = process.env.SITE_MODE;
  const path = request.nextUrl.pathname;
  const adminPage = path === "/admin" || path.startsWith("/admin/");
  const adminApi = path === "/api/admin" || path.startsWith("/api/admin/");

  if (mode === "public" && (adminPage || adminApi)) {
    return adminApi
      ? NextResponse.json({ ok: false, message: "존재하지 않는 경로입니다." }, { status: 404 })
      : new NextResponse("페이지를 찾을 수 없습니다.", { status: 404 });
  }

  if (mode === "admin" && !adminPage && !path.startsWith("/api/")) {
    if (path === "/") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    const publicSite = process.env.NEXT_PUBLIC_SITE_URL;
    if (publicSite) {
      const target = new URL(publicSite);
      if (target.origin !== request.nextUrl.origin) {
        target.pathname = path;
        target.search = request.nextUrl.search;
        return NextResponse.redirect(target);
      }
    }
    return new NextResponse("페이지를 찾을 수 없습니다.", { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf)$).*)"],
};
