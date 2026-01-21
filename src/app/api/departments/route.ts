import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// GET: 부서 목록
export async function GET() {
  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("departments")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ ok: true, departments: data || [] });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}

// POST: 부서 추가
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ ok: false, message: "부서명을 입력해주세요." }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("departments")
      .insert([{ name }])
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ ok: false, message: "이미 존재하는 부서명입니다." }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ ok: true, department: data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}

// DELETE: 부서 삭제
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ ok: false, message: "ID가 필요합니다." }, { status: 400 });
    }

    const supabase = createServerClient();

    const { error } = await supabase
      .from("departments")
      .update({ is_active: false })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}
