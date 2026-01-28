import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { sendApprovalEmail, sendRejectionEmail } from "@/lib/email";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, reason } = body;

    if (!["approved", "rejected", "cancelled"].includes(status)) {
      return NextResponse.json(
        { ok: false, message: "유효하지 않은 상태입니다." },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // 예약 정보 조회 (시설 정보 포함)
    const { data: reservation, error: fetchError } = await supabase
      .from("reservations")
      .select(`
        *,
        facility:facilities(id, name)
      `)
      .eq("id", id)
      .single();

    if (fetchError || !reservation) {
      return NextResponse.json(
        { ok: false, message: "예약을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 상태 업데이트
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "approved") {
      updateData.approved_at = new Date().toISOString();
    }

    if (status === "rejected" && reason) {
      updateData.admin_memo = reason;
    }

    const { data, error } = await supabase
      .from("reservations")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // 활동 로그 기록
    const actionMap: Record<string, string> = {
      approved: "reservation_approve",
      rejected: "reservation_reject",
      cancelled: "reservation_cancel",
    };

    await supabase.from("admin_logs").insert([{
      action: actionMap[status],
      target_type: "reservation",
      target_id: id,
      details: {
        facility_name: reservation.facility?.name,
        applicant_name: reservation.applicant_name || reservation.booker_name,
        date: reservation.start_at,
        reason: reason || null,
      },
    }]);

    // 이메일 발송 (신청자 이메일이 있는 경우)
    const applicantEmail = reservation.applicant_email;
    const applicantName = reservation.applicant_name || reservation.booker_name || "신청자";
    const facilityName = reservation.facility?.name || "시설";

    if (applicantEmail) {
      if (status === "approved") {
        await sendApprovalEmail({
          to: applicantEmail,
          name: applicantName,
          facilityName,
          startAt: reservation.start_at,
          endAt: reservation.end_at,
        });
      } else if (status === "rejected") {
        await sendRejectionEmail({
          to: applicantEmail,
          name: applicantName,
          facilityName,
          startAt: reservation.start_at,
          endAt: reservation.end_at,
          reason,
        });
      }
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

// PATCH: PUT과 동일 (클라이언트 호환성)
export async function PATCH(req: Request, { params }: RouteParams) {
  return PUT(req, { params });
}
