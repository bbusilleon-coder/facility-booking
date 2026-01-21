import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// GET: 예약 검색
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name");
    const phone = searchParams.get("phone");
    const date = searchParams.get("date");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const facilityId = searchParams.get("facilityId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    const supabase = createServerClient();

    let query = supabase
      .from("reservations")
      .select(`
        *,
        facility:facilities(id, name, location)
      `)
      .order("start_at", { ascending: false })
      .limit(limit);

    // 이름 검색 (applicant_name 또는 booker_name)
    if (name) {
      query = query.or(`applicant_name.ilike.%${name}%,booker_name.ilike.%${name}%`);
    }

    // 연락처 검색
    if (phone) {
      const cleanPhone = phone.replace(/-/g, "");
      query = query.or(`applicant_phone.ilike.%${cleanPhone}%,booker_phone.ilike.%${cleanPhone}%`);
    }

    // 특정 날짜
    if (date) {
      const startOfDay = `${date}T00:00:00`;
      const endOfDay = `${date}T23:59:59`;
      query = query.gte("start_at", startOfDay).lte("start_at", endOfDay);
    }

    // 날짜 범위
    if (dateFrom) {
      query = query.gte("start_at", `${dateFrom}T00:00:00`);
    }
    if (dateTo) {
      query = query.lte("start_at", `${dateTo}T23:59:59`);
    }

    // 시설 필터
    if (facilityId) {
      query = query.eq("facility_id", facilityId);
    }

    // 상태 필터
    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      reservations: data || [],
      count: data?.length || 0,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}
