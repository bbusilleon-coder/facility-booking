import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: 시설물 상세 조회
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("facilities")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      facility: data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}

// PUT: 시설물 수정
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("facilities")
      .update({
        name: body.name,
        location: body.location,
        description: body.description,
        image_url: body.image_url,
        images: body.images,
        min_people: body.min_people,
        max_people: body.max_people,
        features: body.features,
        is_active: body.is_active,
        open_time: body.open_time,
        close_time: body.close_time,
        closed_days: body.closed_days,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      facility: data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}

// DELETE: 시설물 삭제
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    const { error } = await supabase
      .from("facilities")
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
