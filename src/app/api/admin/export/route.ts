import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("start");
    const endDate = searchParams.get("end");
    const status = searchParams.get("status");
    const facilityId = searchParams.get("facilityId");

    const supabase = createServerClient();

    let query = supabase
      .from("reservations")
      .select(`
        id, status, purpose, attendees,
        start_at, end_at, created_at,
        applicant_name, applicant_phone, applicant_email, applicant_dept,
        notes, admin_memo,
        facility:facilities(name, location)
      `)
      .order("start_at", { ascending: false });

    if (startDate) {
      query = query.gte("start_at", startDate);
    }
    if (endDate) {
      query = query.lte("start_at", endDate);
    }
    if (status && status !== "all") {
      query = query.eq("status", status);
    }
    if (facilityId) {
      query = query.eq("facility_id", facilityId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // CSV 형식으로 변환
    const statusLabels: Record<string, string> = {
      pending: "승인대기",
      approved: "승인됨",
      rejected: "거절됨",
      cancelled: "취소됨",
    };

    const headers = [
      "시설물",
      "위치",
      "시작일시",
      "종료일시",
      "상태",
      "사용목적",
      "참석인원",
      "신청자",
      "연락처",
      "이메일",
      "소속",
      "비고",
      "관리자메모",
      "신청일",
    ];

    const rows = data?.map((r: any) => [
      r.facility?.name || "",
      r.facility?.location || "",
      new Date(r.start_at).toLocaleString("ko-KR"),
      new Date(r.end_at).toLocaleString("ko-KR"),
      statusLabels[r.status] || r.status,
      r.purpose,
      r.attendees,
      r.applicant_name,
      r.applicant_phone,
      r.applicant_email || "",
      r.applicant_dept || "",
      r.notes || "",
      r.admin_memo || "",
      new Date(r.created_at).toLocaleString("ko-KR"),
    ]) || [];

    // CSV 문자열 생성 (BOM 추가로 한글 깨짐 방지)
    const BOM = "\uFEFF";
    const csvContent = BOM + [
      headers.join(","),
      ...rows.map(row => 
        row.map((cell: any) => {
          // 쉼표, 줄바꿈, 따옴표가 있으면 따옴표로 감싸기
          const str = String(cell);
          if (str.includes(",") || str.includes("\n") || str.includes('"')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(",")
      ),
    ].join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="reservations_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}
