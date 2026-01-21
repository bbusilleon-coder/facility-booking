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
    const { action, email, password, name, phone, department } = body;

    const supabase = createServerClient();

    if (action === "register") {
      // 이메일 중복 체크
      const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();

      if (existing) {
        return NextResponse.json({ ok: false, message: "이미 사용 중인 이메일입니다." }, { status: 400 });
      }

      if (!email || !password || !name) {
        return NextResponse.json({ ok: false, message: "필수 정보를 입력해주세요." }, { status: 400 });
      }

      if (password.length < 4) {
        return NextResponse.json({ ok: false, message: "비밀번호는 4자 이상이어야 합니다." }, { status: 400 });
      }

      const { data: user, error } = await supabase
        .from("users")
        .insert([{
          email,
          password_hash: hashPassword(password),
          name,
          phone: phone?.replace(/-/g, "") || null,
          department,
        }])
        .select("id, email, name, phone, department")
        .single();

      if (error) throw error;

      return NextResponse.json({ ok: true, message: "회원가입이 완료되었습니다.", user });
    }

    if (action === "login") {
      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .eq("is_active", true)
        .single();

      if (error || !user) {
        return NextResponse.json({ ok: false, message: "이메일 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
      }

      if (user.password_hash !== hashPassword(password)) {
        return NextResponse.json({ ok: false, message: "이메일 또는 비밀번호가 올바르지 않습니다." }, { status: 401 });
      }

      const token = generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // 세션 저장 (users 테이블에 토큰 저장하거나 별도 테이블 사용)
      await supabase
        .from("users")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", user.id);

      return NextResponse.json({
        ok: true,
        token,
        expiresAt: expiresAt.toISOString(),
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          department: user.department,
        },
      });
    }

    return NextResponse.json({ ok: false, message: "잘못된 요청입니다." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}
