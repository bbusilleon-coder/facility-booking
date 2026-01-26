import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// PATCH: 예약 수정
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { purpose, attendees, notes } = body;

    const supabase = createServerClient();

    // 예약 존재 확인
    const { data: reservation, error: findError } = await supabase
      .from("reservations")
      .select("*")
      .eq("id", id)
      .single();

    if (findError || !reservation) {
      return NextResponse.json(
        { ok: false, message: "예약을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 취소되거나 거절된 예약은 수정 불가
    if (reservation.status === "cancelled" || reservation.status === "rejected") {
      return NextResponse.json(
        { ok: false, message: "취소되거나 거절된 예약은 수정할 수 없습니다." },
        { status: 400 }
      );
    }

    // 이미 지난 예약은 수정 불가
    if (new Date(reservation.start_at) < new Date()) {
      return NextResponse.json(
        { ok: false, message: "이미 지난 예약은 수정할 수 없습니다." },
        { status: 400 }
      );
    }

    // 업데이트
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (purpose !== undefined) updateData.purpose = purpose;
    if (attendees !== undefined) updateData.attendees = attendees;
    if (notes !== undefined) updateData.notes = notes;

    const { data: updated, error: updateError } = await supabase
      .from("reservations")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      ok: true,
      reservation: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}

// GET: 예약 상세 조회
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("reservations")
      .select(`
        *,
        facility:facilities(id, name, location)
      `)
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { ok: false, message: "예약을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

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

// DELETE: 예약 삭제
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    const { error } = await supabase
      .from("reservations")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}
