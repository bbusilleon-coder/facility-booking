import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT: 관리자 예약 전체 수정
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const supabase = createServerClient();

    const {
      start_at,
      end_at,
      purpose,
      attendees,
      applicant_name,
      applicant_phone,
      applicant_email,
      applicant_dept,
      notes,
      status,
    } = body;

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

    // 업데이트 데이터
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (start_at !== undefined) updateData.start_at = start_at;
    if (end_at !== undefined) updateData.end_at = end_at;
    if (purpose !== undefined) updateData.purpose = purpose;
    if (attendees !== undefined) updateData.attendees = attendees;
    if (applicant_name !== undefined) {
      updateData.applicant_name = applicant_name;
      updateData.booker_name = applicant_name;
    }
    if (applicant_phone !== undefined) {
      const phone = applicant_phone.replace(/-/g, "");
      updateData.applicant_phone = phone;
      updateData.booker_phone = phone;
    }
    if (applicant_email !== undefined) updateData.applicant_email = applicant_email;
    if (applicant_dept !== undefined) updateData.applicant_dept = applicant_dept;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;

    const { data: updated, error: updateError } = await supabase
      .from("reservations")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    // 관리자 로그
    await supabase.from("admin_logs").insert([{
      action: "reservation_edit",
      target_type: "reservation",
      target_id: id,
      details: {
        changes: updateData,
      },
    }]);

    return NextResponse.json({
      ok: true,
      reservation: updated,
    });
  } catch (err: any) {
    console.error("Admin reservation update error:", err);
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}
