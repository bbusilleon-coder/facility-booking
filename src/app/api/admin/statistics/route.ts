import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

    const supabase = createServerClient();

    // 해당 연도의 모든 예약 조회
    const startOfYear = `${year}-01-01T00:00:00Z`;
    const endOfYear = `${year + 1}-01-01T00:00:00Z`;

    const { data: reservations, error: resError } = await supabase
      .from("reservations")
      .select(`
        id, status, start_at, end_at, facility_id, attendees,
        facility:facilities(id, name)
      `)
      .gte("start_at", startOfYear)
      .lt("start_at", endOfYear);

    if (resError) throw resError;

    // 시설물 목록
    const { data: facilities, error: facError } = await supabase
      .from("facilities")
      .select("id, name");

    if (facError) throw facError;

    // 월별 통계 계산
    const monthlyStats = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      total: 0,
      approved: 0,
      rejected: 0,
      cancelled: 0,
      pending: 0,
    }));

    // 시설물별 통계
    const facilityStats: Record<string, {
      id: string;
      name: string;
      total: number;
      approved: number;
      totalHours: number;
      totalAttendees: number;
    }> = {};

    facilities?.forEach((f) => {
      facilityStats[f.id] = {
        id: f.id,
        name: f.name,
        total: 0,
        approved: 0,
        totalHours: 0,
        totalAttendees: 0,
      };
    });

    // 예약 데이터 집계
    reservations?.forEach((r) => {
      const startDate = new Date(r.start_at);
      const month = startDate.getMonth(); // 0-11

      monthlyStats[month].total++;
      monthlyStats[month][r.status as keyof typeof monthlyStats[0]]++;

      if (facilityStats[r.facility_id]) {
        facilityStats[r.facility_id].total++;
        
        if (r.status === "approved") {
          facilityStats[r.facility_id].approved++;
          
          // 이용 시간 계산
          const endDate = new Date(r.end_at);
          const hours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
          facilityStats[r.facility_id].totalHours += hours;
          facilityStats[r.facility_id].totalAttendees += r.attendees || 0;
        }
      }
    });

    // 상태별 전체 통계
    const statusSummary = {
      total: reservations?.length || 0,
      approved: reservations?.filter(r => r.status === "approved").length || 0,
      pending: reservations?.filter(r => r.status === "pending").length || 0,
      rejected: reservations?.filter(r => r.status === "rejected").length || 0,
      cancelled: reservations?.filter(r => r.status === "cancelled").length || 0,
    };

    return NextResponse.json({
      ok: true,
      year,
      monthlyStats,
      facilityStats: Object.values(facilityStats),
      statusSummary,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}
