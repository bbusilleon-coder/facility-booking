import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// GET: 휴일 목록 조회
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year") || new Date().getFullYear().toString();
    const facilityId = searchParams.get("facilityId");

    const supabase = createServerClient();

    let query = supabase
      .from("holidays")
      .select(`
        *,
        facility:facilities(id, name)
      `)
      .gte("date", `${year}-01-01`)
      .lte("date", `${year}-12-31`)
      .order("date", { ascending: true });

    if (facilityId) {
      query = query.or(`facility_id.eq.${facilityId},facility_id.is.null`);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      holidays: data || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}

// POST: 휴일 등록
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("holidays")
      .insert([{
        date: body.date,
        name: body.name,
        facility_id: body.facility_id || null, // null이면 전체 시설물 적용
        is_recurring: body.is_recurring || false, // 매년 반복 여부
      }])
      .select()
      .single();

    if (error) throw error;

    // 활동 로그 기록
    await supabase.from("admin_logs").insert([{
      action: "holiday_create",
      target_type: "holiday",
      target_id: data.id,
      details: { name: body.name, date: body.date },
    }]);

    return NextResponse.json({
      ok: true,
      holiday: data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}

// DELETE: 휴일 삭제 (bulk)
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { ok: false, message: "ID가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { error } = await supabase
      .from("holidays")
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
