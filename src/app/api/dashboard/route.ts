import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createServerClient();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    // 이번 주 시작/끝
    const dayOfWeek = today.getDay();
    const weekStart = new Date(today.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    // 오늘 예약 (승인된 것만)
    const { data: todayReservations } = await supabase
      .from("reservations")
      .select(`
        id, purpose, start_at, end_at, applicant_name,
        facility:facilities(id, name, location)
      `)
      .eq("status", "approved")
      .gte("start_at", today.toISOString())
      .lt("start_at", tomorrow.toISOString())
      .order("start_at", { ascending: true });

    // 이번 주 예약 수
    const { count: weekReservationCount } = await supabase
      .from("reservations")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved")
      .gte("start_at", weekStart.toISOString())
      .lt("start_at", weekEnd.toISOString());

    // 시설물별 이번 주 예약 현황
    const { data: facilityStats } = await supabase
      .from("reservations")
      .select(`
        facility_id,
        facility:facilities(id, name)
      `)
      .eq("status", "approved")
      .gte("start_at", weekStart.toISOString())
      .lt("start_at", weekEnd.toISOString());

    // 시설물별 집계
    const facilityCountMap: Record<string, { id: string; name: string; count: number }> = {};
    facilityStats?.forEach((r: any) => {
      if (r.facility) {
        const id = r.facility.id;
        if (!facilityCountMap[id]) {
          facilityCountMap[id] = { id, name: r.facility.name, count: 0 };
        }
        facilityCountMap[id].count++;
      }
    });

    // 전체 시설물 수
    const { count: totalFacilities } = await supabase
      .from("facilities")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    // 다가오는 예약 (오늘 이후 5개)
    const { data: upcomingReservations } = await supabase
      .from("reservations")
      .select(`
        id, purpose, start_at, end_at, applicant_name, status,
        facility:facilities(id, name)
      `)
      .in("status", ["approved", "pending"])
      .gte("start_at", now.toISOString())
      .order("start_at", { ascending: true })
      .limit(5);

    return NextResponse.json({
      ok: true,
      stats: {
        totalFacilities: totalFacilities || 0,
        todayCount: todayReservations?.length || 0,
        weekCount: weekReservationCount || 0,
      },
      todayReservations: todayReservations || [],
      upcomingReservations: upcomingReservations || [],
      facilityStats: Object.values(facilityCountMap),
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}
