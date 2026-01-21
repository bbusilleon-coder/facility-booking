import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// POST: 회원가입
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    const supabase = createServerClient();

    // 회원가입
    if (action === "register") {
      const { email, password, name, phone, department } = body;

      // 이메일 중복 확인
      const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();

      if (existing) {
        return NextResponse.json(
          { ok: false, message: "이미 사용 중인 이메일입니다." },
          { status: 400 }
        );
      }

      // 사용자 생성
      const { data: user, error } = await supabase
        .from("users")
        .insert([{
          email,
          password_hash: hashPassword(password),
          name,
          phone: phone?.replace(/-/g, "") || null,
          department: department || null,
          is_active: true,
        }])
        .select("id, email, name, department")
        .single();

      if (error) throw error;

      return NextResponse.json({
        ok: true,
        user,
      });
    }

    // 로그인
    if (action === "login") {
      const { email, password } = body;

      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .eq("is_active", true)
        .single();

      if (error || !user) {
        return NextResponse.json(
          { ok: false, message: "이메일 또는 비밀번호가 올바르지 않습니다." },
          { status: 401 }
        );
      }

      if (user.password_hash !== hashPassword(password)) {
        return NextResponse.json(
          { ok: false, message: "이메일 또는 비밀번호가 올바르지 않습니다." },
          { status: 401 }
        );
      }

      // 토큰 생성
      const token = generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await supabase.from("user_sessions").insert([{
        user_id: user.id,
        token,
        expires_at: expiresAt.toISOString(),
      }]);

      // 마지막 로그인 시간 업데이트
      await supabase
        .from("users")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", user.id);

      return NextResponse.json({
        ok: true,
        token,
        expiresAt: expiresAt.toISOString(),
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          department: user.department,
        },
      });
    }

    return NextResponse.json(
      { ok: false, message: "유효하지 않은 요청입니다." },
      { status: 400 }
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
      .from("user_sessions")
      .select(`
        *,
        user:users(id, email, name, department)
      `)
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error || !session) {
      return NextResponse.json(
        { ok: false, message: "유효하지 않은 세션입니다." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      ok: true,
      user: session.user,
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
      .from("user_sessions")
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
