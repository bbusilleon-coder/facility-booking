import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// GET: 공개 예약 조회 (캘린더용 - 승인된 예약만)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const facilityId = searchParams.get("facilityId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!facilityId) {
      return NextResponse.json(
        { ok: false, message: "facilityId가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    let query = supabase
      .from("reservations")
      .select("id, facility_id, start_at, end_at, status")
      .eq("facility_id", facilityId)
      .in("status", ["pending", "approved"]);

    // 날짜 범위 필터
    if (from) {
      query = query.gte("start_at", from);
    }
    if (to) {
      query = query.lte("end_at", to);
    }

    const { data, error } = await query.order("start_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      reservations: data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}
