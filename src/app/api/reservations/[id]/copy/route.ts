import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST: 예약 복사
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { start_at, end_at } = body;

    const supabase = createServerClient();

    // 원본 예약 조회
    const { data: original, error: fetchError } = await supabase
      .from("reservations")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !original) {
      return NextResponse.json(
        { ok: false, message: "원본 예약을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 새 시간대 중복 체크
    const { data: existing } = await supabase
      .from("reservations")
      .select("id")
      .eq("facility_id", original.facility_id)
      .in("status", ["pending", "approved"])
      .lt("start_at", end_at)
      .gt("end_at", start_at);

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { ok: false, message: "해당 시간에 이미 예약이 있습니다." },
        { status: 400 }
      );
    }

    // 새 예약 생성
    const newReservation = {
      facility_id: original.facility_id,
      start_at,
      end_at,
      status: "pending",
      booker_name: original.booker_name,
      booker_phone: original.booker_phone,
      applicant_name: original.applicant_name,
      applicant_phone: original.applicant_phone,
      applicant_email: original.applicant_email,
      applicant_dept: original.applicant_dept,
      purpose: original.purpose,
      attendees: original.attendees,
      notes: original.notes ? `[복사됨] ${original.notes}` : "[복사된 예약]",
    };

    const { data, error } = await supabase
      .from("reservations")
      .insert([newReservation])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      reservation: data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}
