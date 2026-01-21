import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// GET: 시설물 목록 조회
export async function GET() {
  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("facilities")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      facilities: data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}

// POST: 시설물 생성
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("facilities")
      .insert([{
        name: body.name,
        location: body.location || null,
        description: body.description || null,
        image_url: body.image_url || null,
        images: body.images || [],
        min_people: body.min_people || 1,
        max_people: body.max_people || 10,
        features: body.features || {},
        is_active: body.is_active ?? true,
        open_time: body.open_time || "09:00",
        close_time: body.close_time || "22:00",
        closed_days: body.closed_days || [],
      }])
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
