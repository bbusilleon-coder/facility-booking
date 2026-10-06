import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function requireSuperAdmin(request: Request) {
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ") || !authorization.slice(7)) {
    return NextResponse.json({ ok: false, message: "관리자 로그인이 필요합니다." }, { status: 401 });
  }

  const supabase = createServerClient();
  const { data: session, error: sessionError } = await supabase
    .from("admin_sessions")
    .select("admin_id")
    .eq("token", authorization.slice(7))
    .gt("expires_at", new Date().toISOString())
    .single();

  if (sessionError || !session) {
    if (sessionError) console.error("Admin session validation failed", sessionError.code, sessionError.message);
    if (sessionError?.code === "42703" || sessionError?.code === "PGRST204") {
      return NextResponse.json({ ok: false, message: "관리자 세션 테이블 설정을 확인해주세요." }, { status: 503 });
    }
    return NextResponse.json({ ok: false, message: "유효하지 않은 세션입니다." }, { status: 401 });
  }

  // Account management requires a named, active super administrator.
  // Legacy password-only sessions cannot establish this permission.
  if (!session.admin_id) {
    return NextResponse.json({ ok: false, message: "슈퍼관리자 계정으로 로그인해주세요." }, { status: 403 });
  }
  const { data: admin, error: adminError } = await supabase
    .from("admins")
    .select("role, is_active")
    .eq("id", session.admin_id)
    .single();
  if (adminError || !admin?.is_active || !["super", "super_admin"].includes(admin.role)) {
    return NextResponse.json({ ok: false, message: "슈퍼관리자만 접근할 수 있습니다." }, { status: 403 });
  }
  return null;
}
