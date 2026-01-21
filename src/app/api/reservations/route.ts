import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { sendNewReservationNotification } from "@/lib/email";

// GET: 예약 목록 조회 (관리자용)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const facilityId = searchParams.get("facilityId");
    const search = searchParams.get("search");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const supabase = createServerClient();

    let query = supabase
      .from("reservations")
      .select(`
        *,
        facility:facilities(id, name, location)
      `)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    if (facilityId) {
      query = query.eq("facility_id", facilityId);
    }

    // 검색 (이름 또는 연락처)
    if (search) {
      query = query.or(`applicant_name.ilike.%${search}%,applicant_phone.ilike.%${search}%,booker_name.ilike.%${search}%,booker_phone.ilike.%${search}%`);
    }

    // 날짜 필터
    if (dateFrom) {
      query = query.gte("start_at", dateFrom);
    }
    if (dateTo) {
      query = query.lte("start_at", dateTo + "T23:59:59");
    }

    const { data, error } = await query;

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

// POST: 예약 생성
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = createServerClient();

    const startAt = new Date(body.start_at);
    const endAt = new Date(body.end_at);

    // 시간 유효성 검사
    if (endAt <= startAt) {
      return NextResponse.json(
        { ok: false, message: "종료 시간은 시작 시간보다 늦어야 합니다." },
        { status: 400 }
      );
    }

    // 과거 시간 체크
    if (startAt < new Date()) {
      return NextResponse.json(
        { ok: false, message: "과거 시간에는 예약할 수 없습니다." },
        { status: 400 }
      );
    }

    // 시설물 정보 조회
    const { data: facility } = await supabase
      .from("facilities")
      .select("name, open_time, close_time, closed_days, is_active")
      .eq("id", body.facility_id)
      .single();

    if (!facility || !facility.is_active) {
      return NextResponse.json(
        { ok: false, message: "예약할 수 없는 시설물입니다." },
        { status: 400 }
      );
    }

    // 휴무일 체크
    const dayOfWeek = startAt.getDay();
    if (facility.closed_days && facility.closed_days.includes(dayOfWeek)) {
      const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
      return NextResponse.json(
        { ok: false, message: `${dayNames[dayOfWeek]}요일은 휴무일입니다.` },
        { status: 400 }
      );
    }

    // 운영시간 체크
    if (facility.open_time && facility.close_time) {
      const startHour = startAt.getHours() * 60 + startAt.getMinutes();
      const endHour = endAt.getHours() * 60 + endAt.getMinutes();
      const [openH, openM] = facility.open_time.split(":").map(Number);
      const [closeH, closeM] = facility.close_time.split(":").map(Number);
      const openMinutes = openH * 60 + openM;
      const closeMinutes = closeH * 60 + closeM;

      if (startHour < openMinutes || endHour > closeMinutes) {
        return NextResponse.json(
          { ok: false, message: `운영시간은 ${facility.open_time} ~ ${facility.close_time}입니다.` },
          { status: 400 }
        );
      }
    }

    // 중복 예약 체크
    const { data: existing } = await supabase
      .from("reservations")
      .select("id, start_at, end_at")
      .eq("facility_id", body.facility_id)
      .in("status", ["pending", "approved"])
      .lt("start_at", body.end_at)
      .gt("end_at", body.start_at);

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { ok: false, message: "해당 시간에 이미 예약이 있습니다." },
        { status: 400 }
      );
    }

    // 예약 생성
    const reservationData: any = {
      facility_id: body.facility_id,
      start_at: body.start_at,
      end_at: body.end_at,
      status: "pending",
      booker_name: body.applicant_name,
      booker_phone: body.applicant_phone?.replace(/-/g, "") || "",
      applicant_name: body.applicant_name,
      applicant_phone: body.applicant_phone?.replace(/-/g, "") || "",
      applicant_email: body.applicant_email || null,
      applicant_dept: body.applicant_dept || null,
      purpose: body.purpose,
      attendees: body.attendees || 1,
      notes: body.notes || null,
    };

    const { data, error } = await supabase
      .from("reservations")
      .insert([reservationData])
      .select()
      .single();

    if (error) throw error;

    // 관리자에게 알림 이메일 발송
    const { data: adminSettings } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "notification_email")
      .single();

    if (adminSettings?.value) {
      const dateStr = startAt.toLocaleDateString("ko-KR");
      const timeStr = `${startAt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })} ~ ${endAt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`;

      await sendNewReservationNotification(adminSettings.value, {
        facilityName: facility.name,
        date: dateStr,
        time: timeStr,
        applicantName: body.applicant_name,
        applicantPhone: body.applicant_phone,
        purpose: body.purpose,
      });
    }

    return NextResponse.json({
      ok: true,
      reservation: data,
    });
  } catch (err: any) {
    console.error("Reservation error:", err);
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}
