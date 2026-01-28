import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST: 예약 연장
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { new_end_at } = body;

    const supabase = createServerClient();

    // 원본 예약 조회
    const { data: reservation, error: fetchError } = await supabase
      .from("reservations")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !reservation) {
      return NextResponse.json(
        { ok: false, message: "예약을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 승인된 예약만 연장 가능
    if (reservation.status !== "approved") {
      return NextResponse.json(
        { ok: false, message: "승인된 예약만 연장할 수 있습니다." },
        { status: 400 }
      );
    }

    const newEndAt = new Date(new_end_at);
    const currentEndAt = new Date(reservation.end_at);

    // 연장 시간이 기존 종료 시간보다 늦어야 함
    if (newEndAt <= currentEndAt) {
      return NextResponse.json(
        { ok: false, message: "연장 시간은 기존 종료 시간보다 늦어야 합니다." },
        { status: 400 }
      );
    }

    // 연장 시간대에 다른 예약이 있는지 확인
    const { data: conflict } = await supabase
      .from("reservations")
      .select("id")
      .eq("facility_id", reservation.facility_id)
      .neq("id", id)
      .in("status", ["pending", "approved"])
      .lt("start_at", new_end_at)
      .gt("end_at", reservation.end_at);

    if (conflict && conflict.length > 0) {
      return NextResponse.json(
        { ok: false, message: "연장 시간대에 다른 예약이 있습니다." },
        { status: 400 }
      );
    }

    // 운영시간 체크
    const { data: facility } = await supabase
      .from("facilities")
      .select("close_time")
      .eq("id", reservation.facility_id)
      .single();

    if (facility?.close_time) {
      const endHour = newEndAt.getHours() * 60 + newEndAt.getMinutes();
      const [closeH, closeM] = facility.close_time.split(":").map(Number);
      const closeMinutes = closeH * 60 + closeM;

      if (endHour > closeMinutes) {
        return NextResponse.json(
          { ok: false, message: `운영시간(~${facility.close_time})을 초과할 수 없습니다.` },
          { status: 400 }
        );
      }
    }

    // 타임존 추가 함수
    const addTimezone = (dt: string) => {
      if (dt.includes("+") || dt.includes("Z")) return dt;
      return dt.includes(":00:00") ? dt + "+09:00" : dt + ":00+09:00";
    };

    const newEndAtWithTz = addTimezone(new_end_at);

    // 예약 연장
    const { data, error } = await supabase
      .from("reservations")
      .update({
        end_at: newEndAtWithTz,
        notes: reservation.notes 
          ? `${reservation.notes} [연장됨]` 
          : "[연장된 예약]",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // 활동 로그
    await supabase.from("admin_logs").insert([{
      action: "reservation_extend",
      target_type: "reservation",
      target_id: id,
      details: {
        original_end: reservation.end_at,
        new_end: new_end_at,
      },
    }]);

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
