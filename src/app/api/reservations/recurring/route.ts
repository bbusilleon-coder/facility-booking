import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// POST: 정기 예약 생성
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = createServerClient();

    const {
      facility_id,
      start_time, // "09:00"
      end_time,   // "11:00"
      purpose,
      attendees,
      applicant_name,
      applicant_phone,
      applicant_email,
      applicant_dept,
      notes,
      // 정기 예약 옵션
      repeat_type, // "weekly" | "biweekly" | "monthly"
      repeat_days, // [1, 3, 5] 월수금 (0=일, 1=월, ...)
      start_date,  // "2024-01-01"
      end_date,    // "2024-03-31"
    } = body;

    // 날짜 계산
    const startD = new Date(start_date);
    const endD = new Date(end_date);
    const reservationDates: Date[] = [];

    // 최대 예약 개수 제한 (50개)
    const MAX_RESERVATIONS = 50;

    let currentDate = new Date(startD);
    while (currentDate <= endD && reservationDates.length < MAX_RESERVATIONS) {
      const dayOfWeek = currentDate.getDay();

      if (repeat_type === "weekly" || repeat_type === "biweekly") {
        if (repeat_days.includes(dayOfWeek)) {
          reservationDates.push(new Date(currentDate));
        }
      } else if (repeat_type === "monthly") {
        // 매월 같은 날짜
        if (currentDate.getDate() === startD.getDate()) {
          reservationDates.push(new Date(currentDate));
        }
      }

      // 다음 날로 이동
      if (repeat_type === "biweekly" && currentDate.getDay() === 6) {
        // 격주: 토요일이면 1주 건너뛰기
        currentDate.setDate(currentDate.getDate() + 8);
      } else {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    if (reservationDates.length === 0) {
      return NextResponse.json(
        { ok: false, message: "선택한 기간에 해당하는 날짜가 없습니다." },
        { status: 400 }
      );
    }

    // 시설물 정보 조회
    const { data: facility } = await supabase
      .from("facilities")
      .select("open_time, close_time, closed_days, is_active")
      .eq("id", facility_id)
      .single();

    if (!facility || !facility.is_active) {
      return NextResponse.json(
        { ok: false, message: "예약할 수 없는 시설물입니다." },
        { status: 400 }
      );
    }

    // 휴일 조회
    const { data: holidays } = await supabase
      .from("holidays")
      .select("date")
      .or(`facility_id.eq.${facility_id},facility_id.is.null`)
      .gte("date", start_date)
      .lte("date", end_date);

    const holidayDates = new Set((holidays || []).map(h => h.date));

    // 예약 생성
    const reservations = [];
    const conflicts = [];
    const skipped = [];

    for (const date of reservationDates) {
      const dateStr = date.toISOString().split("T")[0];

      // 휴무일 체크
      const dayOfWeek = date.getDay();
      if (facility.closed_days?.includes(dayOfWeek)) {
        skipped.push({ date: dateStr, reason: "휴무일" });
        continue;
      }

      // 휴일 체크
      if (holidayDates.has(dateStr)) {
        skipped.push({ date: dateStr, reason: "휴일" });
        continue;
      }

      // 시작/종료 시간 생성
      const [startH, startM] = start_time.split(":").map(Number);
      const [endH, endM] = end_time.split(":").map(Number);

      const startAt = new Date(date);
      startAt.setHours(startH, startM, 0, 0);

      const endAt = new Date(date);
      endAt.setHours(endH, endM, 0, 0);

      // 중복 체크
      const { data: existing } = await supabase
        .from("reservations")
        .select("id")
        .eq("facility_id", facility_id)
        .in("status", ["pending", "approved"])
        .lt("start_at", endAt.toISOString())
        .gt("end_at", startAt.toISOString());

      if (existing && existing.length > 0) {
        conflicts.push({ date: dateStr, reason: "기존 예약 있음" });
        continue;
      }

      reservations.push({
        facility_id,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        status: "pending",
        purpose,
        attendees,
        applicant_name,
        applicant_phone: applicant_phone.replace(/-/g, ""),
        applicant_email: applicant_email || null,
        applicant_dept: applicant_dept || null,
        notes: notes ? `[정기예약] ${notes}` : "[정기예약]",
      });
    }

    if (reservations.length === 0) {
      return NextResponse.json({
        ok: false,
        message: "생성 가능한 예약이 없습니다.",
        conflicts,
        skipped,
      }, { status: 400 });
    }

    // 일괄 삽입
    const { data: created, error } = await supabase
      .from("reservations")
      .insert(reservations)
      .select();

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      created: created?.length || 0,
      conflicts,
      skipped,
      message: `${created?.length || 0}건의 정기 예약이 신청되었습니다.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}
