import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// GET: 즐겨찾기 목록
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userIdentifier = searchParams.get("user");

    if (!userIdentifier) {
      return NextResponse.json({ ok: false, message: "사용자 정보가 필요합니다." }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("favorites")
      .select(`
        id,
        facility_id,
        created_at,
        facility:facilities(id, name, location, image_url, min_people, max_people)
      `)
      .eq("user_identifier", userIdentifier)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      favorites: data || [],
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}

// POST: 즐겨찾기 추가
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_identifier, facility_id } = body;

    if (!user_identifier || !facility_id) {
      return NextResponse.json({ ok: false, message: "필수 정보가 누락되었습니다." }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("favorites")
      .insert([{ user_identifier, facility_id }])
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ ok: false, message: "이미 즐겨찾기에 추가되어 있습니다." }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ ok: true, favorite: data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}

// DELETE: 즐겨찾기 삭제
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userIdentifier = searchParams.get("user");
    const facilityId = searchParams.get("facilityId");

    if (!userIdentifier || !facilityId) {
      return NextResponse.json({ ok: false, message: "필수 정보가 누락되었습니다." }, { status: 400 });
    }

    const supabase = createServerClient();

    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_identifier", userIdentifier)
      .eq("facility_id", facilityId);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}
