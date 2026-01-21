import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: 공지사항 상세
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("notices")
      .select("*")
      .eq("id", id)
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

// PUT: 공지사항 수정
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("notices")
      .update({
        title: body.title,
        content: body.content,
        is_active: body.is_active,
        is_pinned: body.is_pinned,
        start_date: body.start_date,
        end_date: body.end_date,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
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

// DELETE: 공지사항 삭제
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    const { error } = await supabase
      .from("notices")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}
