import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// GET: 회원 목록 조회
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    const supabase = createServerClient();

    let query = supabase
      .from("users")
      .select("id, email, name, phone, department, is_active, last_login_at, created_at")
      .order("created_at", { ascending: false });

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,department.ilike.%${search}%`
      );
    }

    const { data, error } = await query.limit(500);

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      members: data || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}

// POST: 회원 등록
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name, phone, department } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { ok: false, message: "필수 항목을 입력해주세요." },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

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

    // 회원 생성
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
      .select("id, email, name")
      .single();

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      user,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}
