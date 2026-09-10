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

    // 날짜 계산 (타임존에 의존하지 않도록 문자열 기반으로 처리)
    // "YYYY-MM-DD" 문자열을 직접 파싱하여 UTC/KST 차이 문제 방지
    const parseLocalDate = (dateStr: string) => {
      const [y, m, d] = dateStr.split("-").map(Number);
      return { year: y, month: m, day: d };
    };

    const startParsed = parseLocalDate(start_date);
    const endParsed = parseLocalDate(end_date);

    // 날짜 문자열 배열 생성 (Date 객체 대신 "YYYY-MM-DD" 문자열 사용)
    const pad = (n: number) => n.toString().padStart(2, "0");

    const toDateStr = (y: number, m: number, d: number) =>
      `${y}-${pad(m)}-${pad(d)}`;

    // 날짜 연산을 위해 UTC noon(12시)으로 Date 생성하여 시간대 문제 방지
    const makeSafeDate = (y: number, m: number, d: number) =>
      new Date(Date.UTC(y, m - 1, d, 12, 0, 0));

    const startD = makeSafeDate(startParsed.year, startParsed.month, startParsed.day);
    const endD = makeSafeDate(endParsed.year, endParsed.month, endParsed.day);

    type DateEntry = { dateStr: string; dayOfWeek: number };
    const reservationDates: DateEntry[] = [];

    // 최대 예약 개수 제한 (50개)
    const MAX_RESERVATIONS = 50;

    let currentDate = new Date(startD);
    while (currentDate <= endD && reservationDates.length < MAX_RESERVATIONS) {
      const dayOfWeek = currentDate.getUTCDay(); // UTC 기준 요일 (noon이므로 안전)
      const y = currentDate.getUTCFullYear();
      const m = currentDate.getUTCMonth() + 1;
      const d = currentDate.getUTCDate();

      if (repeat_type === "weekly" || repeat_type === "biweekly") {
        if (repeat_days.includes(dayOfWeek)) {
          reservationDates.push({ dateStr: toDateStr(y, m, d), dayOfWeek });
        }
      } else if (repeat_type === "monthly") {
        // 매월 같은 날짜
        if (d === startParsed.day) {
          reservationDates.push({ dateStr: toDateStr(y, m, d), dayOfWeek });
        }
      }

      // 다음 날로 이동
      if (repeat_type === "biweekly" && dayOfWeek === 6) {
        // 격주: 토요일이면 1주 건너뛰기
        currentDate.setUTCDate(currentDate.getUTCDate() + 8);
      } else {
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
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

    for (const entry of reservationDates) {
      const dateStr = entry.dateStr;

      // 휴무일 체크
      if (facility.closed_days?.includes(entry.dayOfWeek)) {
        skipped.push({ date: dateStr, reason: "휴무일" });
        continue;
      }

      // 휴일 체크
      if (holidayDates.has(dateStr)) {
        skipped.push({ date: dateStr, reason: "휴일" });
        continue;
      }

      // 시작/종료 시간 생성 (한국 시간대 포함)
      const [startH, startM] = start_time.split(":").map(Number);
      const [endH, endM] = end_time.split(":").map(Number);

      // "YYYY-MM-DDTHH:mm:00+09:00" 형식으로 저장
      const startAtStr = `${dateStr}T${pad(startH)}:${pad(startM)}:00+09:00`;
      const endAtStr = `${dateStr}T${pad(endH)}:${pad(endM)}:00+09:00`;

      // 중복 체크 (KST 기준 문자열 사용)
      const { data: existing } = await supabase
        .from("reservations")
        .select("id")
        .eq("facility_id", facility_id)
        .in("status", ["pending", "approved"])
        .lt("start_at", endAtStr)
        .gt("end_at", startAtStr);

      if (existing && existing.length > 0) {
        conflicts.push({ date: dateStr, reason: "기존 예약 있음" });
        continue;
      }

      reservations.push({
        facility_id,
        start_at: startAtStr,
        end_at: endAtStr,
        status: "pending",
        purpose,
        attendees,
        booker_name: applicant_name,
        booker_phone: applicant_phone.replace(/-/g, ""),
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
