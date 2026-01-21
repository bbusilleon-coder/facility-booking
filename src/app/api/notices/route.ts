import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// GET: 공지사항 목록 조회
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") === "true";
    const limit = parseInt(searchParams.get("limit") || "10");

    const supabase = createServerClient();

    let query = supabase
      .from("notices")
      .select("*")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(limit);

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      notices: data || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}

// POST: 공지사항 생성
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("notices")
      .insert([{
        title: body.title,
        content: body.content,
        is_active: body.is_active ?? true,
        is_pinned: body.is_pinned ?? false,
        start_date: body.start_date || null,
        end_date: body.end_date || null,
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      notice: data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}
