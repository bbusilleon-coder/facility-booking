import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import {
  sendReservationConfirmation,
  sendNewReservationNotification,
} from "@/lib/email";

/**
 * datetime-local(예: "2026-01-30T15:00")을
 * "로컬 시간" 기준으로 안전하게 Date로 변환.
 */
function parseLocalDateTime(value: string): Date {
  const [datePart, timePart] = value.split("T");
  if (!datePart || !timePart) throw new Error("Invalid datetime format");

  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm] = timePart.split(":").map(Number);

  if (
    !Number.isFinite(y) ||
    !Number.isFinite(m) ||
    !Number.isFinite(d) ||
    !Number.isFinite(hh) ||
    !Number.isFinite(mm)
  ) {
    throw new Error("Invalid datetime numbers");
  }

  return new Date(y, m - 1, d, hh, mm, 0, 0);
}

/** "HH:mm" -> minutes */
function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) throw new Error("Invalid HH:mm");
  return h * 60 + m;
}

/** Date -> minutes of day */
function dateToMinutesOfDay(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

/** 날짜가 같은지(연/월/일) */
function isSameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// GET: 예약 목록 조회 (관리자/조회용)
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
      .select(
        `
        *,
        facility:facilities(id, name, location)
      `
      )
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);
    if (facilityId) query = query.eq("facility_id", facilityId);

    if (search) {
      query = query.or(
        `applicant_name.ilike.%${search}%,applicant_phone.ilike.%${search}%,booker_name.ilike.%${search}%,booker_phone.ilike.%${search}%`
      );
    }

    if (dateFrom) query = query.gte("start_at", dateFrom);
    if (dateTo) query = query.lte("start_at", `${dateTo}T23:59:59`);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ ok: true, reservations: data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err?.message ?? "Server error" }, { status: 500 });
  }
}

// POST: 예약 생성
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = createServerClient();

    const startAt = parseLocalDateTime(body.start_at);
    const endAt = parseLocalDateTime(body.end_at);

    if (endAt <= startAt) {
      return NextResponse.json(
        { ok: false, message: "종료 시간은 시작 시간보다 늦어야 합니다." },
        { status: 400 }
      );
    }

    if (!isSameDate(startAt, endAt)) {
      return NextResponse.json(
        { ok: false, message: "시작/종료 일자는 동일해야 합니다." },
        { status: 400 }
      );
    }

    const now = new Date();
    if (startAt < now) {
      return NextResponse.json(
        { ok: false, message: "과거 시간에는 예약할 수 없습니다." },
        { status: 400 }
      );
    }

    const { data: facility, error: facilityError } = await supabase
      .from("facilities")
      .select("id, name, open_time, close_time, closed_days, is_active")
      .eq("id", body.facility_id)
      .single();

    if (facilityError || !facility || !facility.is_active) {
      return NextResponse.json(
        { ok: false, message: "예약할 수 없는 시설물입니다." },
        { status: 400 }
      );
    }

    const dayOfWeek = startAt.getDay();
    if (facility.closed_days && facility.closed_days.includes(dayOfWeek)) {
      const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
      return NextResponse.json(
        { ok: false, message: `${dayNames[dayOfWeek]}요일은 휴무일입니다.` },
        { status: 400 }
      );
    }

    if (facility.open_time && facility.close_time) {
      const startMin = dateToMinutesOfDay(startAt);
      const endMin = dateToMinutesOfDay(endAt);
      const openMin = hhmmToMinutes(facility.open_time);
      const closeMin = hhmmToMinutes(facility.close_time);

      const within = startMin >= openMin && endMin <= closeMin && endMin > startMin;

      if (!within) {
        return NextResponse.json(
          { ok: false, message: `운영시간은 ${facility.open_time} ~ ${facility.close_time}입니다.` },
          { status: 400 }
        );
      }
    }

    const newStartISO = startAt.toISOString();
    const newEndISO = endAt.toISOString();

    const { data: existing, error: overlapError } = await supabase
      .from("reservations")
      .select("id, start_at, end_at, status")
      .eq("facility_id", body.facility_id)
      .in("status", ["pending", "approved"])
      .lt("start_at", newEndISO)
      .gt("end_at", newStartISO);

    if (overlapError) throw overlapError;

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { ok: false, message: "해당 시간에 이미 예약이 있습니다." },
        { status: 400 }
      );
    }

    // 예약 데이터 구성 (qr_code 제거)
    // 로컬 시간에 한국 시간대(+09:00)를 명시적으로 추가하여 저장
    const startAtWithTz = body.start_at + ":00+09:00";  // "2026-02-24T10:00:00+09:00"
    const endAtWithTz = body.end_at + ":00+09:00";      // "2026-02-24T17:00:00+09:00"

    const reservationData: any = {
      facility_id: body.facility_id,
      start_at: startAtWithTz,
      end_at: endAtWithTz,
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

    // 사용자에게 예약 확인 이메일
    if (body.applicant_email) {
      await sendReservationConfirmation({
        to: body.applicant_email,
        name: body.applicant_name,
        facilityName: facility.name,
        startAt: body.start_at,
        endAt: body.end_at,
        purpose: body.purpose,
      });
    }

    // 관리자에게 신규 예약 알림 이메일
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
    if (adminEmail) {
      await sendNewReservationNotification({
        to: adminEmail,
        facilityName: facility.name,
        applicantName: body.applicant_name,
        applicantPhone: body.applicant_phone?.replace(/-/g, "") || "",
        startAt: body.start_at,
        endAt: body.end_at,
        purpose: body.purpose,
      });
    }

    return NextResponse.json({ ok: true, reservation: data });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
