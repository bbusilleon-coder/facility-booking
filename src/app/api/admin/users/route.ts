import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// GET: 관리자 목록 조회
export async function GET() {
  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("admins")
      .select("id, username, name, email, phone, role, is_active, last_login_at, created_at")
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      admins: data || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}

// POST: 관리자 추가
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = createServerClient();

    // 아이디 중복 체크
    const { data: existing } = await supabase
      .from("admins")
      .select("id")
      .eq("username", body.username)
      .single();

    if (existing) {
      return NextResponse.json(
        { ok: false, message: "이미 사용 중인 아이디입니다." },
        { status: 400 }
      );
    }

    // 비밀번호 최소 길이 체크
    if (!body.password || body.password.length < 4) {
      return NextResponse.json(
        { ok: false, message: "비밀번호는 최소 4자 이상이어야 합니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("admins")
      .insert([{
        username: body.username,
        password_hash: hashPassword(body.password),
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        role: body.role || "admin",
        is_active: true,
      }])
      .select("id, username, name, role, is_active, created_at")
      .single();

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      admin: data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}
