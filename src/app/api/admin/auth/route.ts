import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// POST: 로그인
export async function POST(req: Request) {
  try {
    const { username, password, rememberMe } = await req.json();
    const supabase = createServerClient();

    // 1. 먼저 admins 테이블에서 조회
    const { data: admin, error: adminError } = await supabase
      .from("admins")
      .select("*")
      .eq("username", username || "admin")
      .eq("is_active", true)
      .single();

    // admins 테이블이 있고 사용자가 있으면
    if (admin && !adminError) {
      if (admin.password_hash !== hashPassword(password)) {
        return NextResponse.json(
          { ok: false, message: "아이디 또는 비밀번호가 올바르지 않습니다." },
          { status: 401 }
        );
      }

      const token = generateToken();
      const expiresAt = new Date();
      
      if (rememberMe) {
        expiresAt.setDate(expiresAt.getDate() + 7);
      } else {
        expiresAt.setMinutes(expiresAt.getMinutes() + 30);
      }

      // 기존 만료 세션 정리
      await supabase
        .from("admin_sessions")
        .delete()
        .lt("expires_at", new Date().toISOString());

      // 새 세션 저장
      await supabase.from("admin_sessions").insert([{
        token,
        expires_at: expiresAt.toISOString(),
        remember_me: rememberMe || false,
        admin_id: admin.id,
      }]);

      // 마지막 로그인 시간 업데이트
      await supabase
        .from("admins")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", admin.id);

      return NextResponse.json({
        ok: true,
        token,
        expiresAt: expiresAt.toISOString(),
        admin: {
          id: admin.id,
          username: admin.username,
          name: admin.name,
          role: admin.role,
        },
      });
    }

    // 2. 기존 단일 비밀번호 방식 (admin_settings) 호환
    const { data: settings } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "admin_password")
      .single();

    if (settings && settings.value === hashPassword(password)) {
      const token = generateToken();
      const expiresAt = new Date();
      
      if (rememberMe) {
        expiresAt.setDate(expiresAt.getDate() + 7);
      } else {
        expiresAt.setMinutes(expiresAt.getMinutes() + 30);
      }

      await supabase.from("admin_sessions").insert([{
        token,
        expires_at: expiresAt.toISOString(),
        remember_me: rememberMe || false,
      }]);

      return NextResponse.json({
        ok: true,
        token,
        expiresAt: expiresAt.toISOString(),
        admin: { name: "관리자", role: "super_admin" },
      });
    }

    return NextResponse.json(
      { ok: false, message: "아이디 또는 비밀번호가 올바르지 않습니다." },
      { status: 401 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}

// GET: 세션 확인
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { ok: false, message: "인증 토큰이 없습니다." },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const supabase = createServerClient();

    const { data: session, error } = await supabase
      .from("admin_sessions")
      .select("*")
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error || !session) {
      return NextResponse.json(
        { ok: false, message: "유효하지 않은 세션입니다." },
        { status: 401 }
      );
    }

    // 30분 세션이면 갱신
    if (!session.remember_me) {
      const newExpiresAt = new Date();
      newExpiresAt.setMinutes(newExpiresAt.getMinutes() + 30);

      await supabase
        .from("admin_sessions")
        .update({ expires_at: newExpiresAt.toISOString() })
        .eq("token", token);
    }

    return NextResponse.json({
      ok: true,
      session: {
        expiresAt: session.expires_at,
        rememberMe: session.remember_me,
        adminId: session.admin_id,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}

// DELETE: 로그아웃
export async function DELETE(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ ok: true });
    }

    const token = authHeader.substring(7);
    const supabase = createServerClient();

    await supabase
      .from("admin_sessions")
      .delete()
      .eq("token", token);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}
