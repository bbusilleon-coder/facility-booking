import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// GET: 예약 정보 조회 (QR 스캔 시)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { ok: false, message: "체크인 코드가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // 예약 조회 (code = 예약 ID 앞 8자리)
    const { data: reservations, error } = await supabase
      .from("reservations")
      .select(`
        *,
        facility:facilities(name, location)
      `)
      .eq("status", "approved")
      .ilike("id", `${code}%`);

    if (error) throw error;

    if (!reservations || reservations.length === 0) {
      return NextResponse.json(
        { ok: false, message: "유효하지 않은 체크인 코드입니다." },
        { status: 404 }
      );
    }

    const reservation = reservations[0];
    const now = new Date();
    const startAt = new Date(reservation.start_at);
    const endAt = new Date(reservation.end_at);

    // 체크인 가능 시간 확인 (시작 30분 전 ~ 종료 시간)
    const checkinStart = new Date(startAt.getTime() - 30 * 60 * 1000);
    
    if (now < checkinStart) {
      return NextResponse.json({
        ok: false,
        message: "체크인 가능 시간이 아닙니다. (시작 30분 전부터 가능)",
        reservation: {
          id: reservation.id,
          facility: reservation.facility?.name,
          startAt: reservation.start_at,
          endAt: reservation.end_at,
        },
      });
    }

    if (now > endAt) {
      return NextResponse.json({
        ok: false,
        message: "예약 시간이 종료되었습니다.",
        reservation: {
          id: reservation.id,
          facility: reservation.facility?.name,
          startAt: reservation.start_at,
          endAt: reservation.end_at,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      reservation: {
        id: reservation.id,
        facility: reservation.facility?.name,
        location: reservation.facility?.location,
        applicant: reservation.applicant_name || reservation.booker_name,
        purpose: reservation.purpose,
        attendees: reservation.attendees,
        startAt: reservation.start_at,
        endAt: reservation.end_at,
        checkedIn: reservation.checked_in_at ? true : false,
        checkedInAt: reservation.checked_in_at,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}

// POST: 체크인 처리
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { ok: false, message: "체크인 코드가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // 예약 조회
    const { data: reservations, error: fetchError } = await supabase
      .from("reservations")
      .select("*")
      .eq("status", "approved")
      .ilike("id", `${code}%`);

    if (fetchError) throw fetchError;

    if (!reservations || reservations.length === 0) {
      return NextResponse.json(
        { ok: false, message: "유효하지 않은 체크인 코드입니다." },
        { status: 404 }
      );
    }

    const reservation = reservations[0];

    // 이미 체크인 되었는지 확인
    if (reservation.checked_in_at) {
      return NextResponse.json({
        ok: false,
        message: "이미 체크인 되었습니다.",
        checkedInAt: reservation.checked_in_at,
      });
    }

    // 체크인 처리
    const { data, error } = await supabase
      .from("reservations")
      .update({
        checked_in_at: new Date().toISOString(),
      })
      .eq("id", reservation.id)
      .select()
      .single();

    if (error) throw error;

    // 활동 로그
    await supabase.from("admin_logs").insert([{
      action: "reservation_checkin",
      target_type: "reservation",
      target_id: reservation.id,
      details: {
        applicant_name: reservation.applicant_name || reservation.booker_name,
        checked_in_at: new Date().toISOString(),
      },
    }]);

    return NextResponse.json({
      ok: true,
      message: "체크인 완료!",
      checkedInAt: data.checked_in_at,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}
