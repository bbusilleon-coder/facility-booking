import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: 예약 확인서 HTML 생성 (인쇄용)
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    const { data: reservation, error } = await supabase
      .from("reservations")
      .select(`
        *,
        facility:facilities(id, name, location)
      `)
      .eq("id", id)
      .single();

    if (error || !reservation) {
      return new Response("예약을 찾을 수 없습니다.", { status: 404 });
    }

    const startAt = new Date(reservation.start_at);
    const endAt = new Date(reservation.end_at);

    const formatDate = (d: Date) => d.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });

    const formatTime = (d: Date) => d.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const statusLabels: Record<string, string> = {
      pending: "승인 대기",
      approved: "승인됨",
      rejected: "거절됨",
      cancelled: "취소됨",
    };

    const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>예약 확인서 - ${reservation.facility?.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Malgun Gothic', sans-serif; 
      padding: 40px; 
      max-width: 800px; 
      margin: 0 auto;
      color: #333;
    }
    .header { 
      text-align: center; 
      border-bottom: 3px solid #333; 
      padding-bottom: 20px; 
      margin-bottom: 30px; 
    }
    .header h1 { font-size: 28px; margin-bottom: 8px; }
    .header p { color: #666; }
    .section { margin-bottom: 24px; }
    .section-title { 
      font-size: 14px; 
      font-weight: bold; 
      color: #666; 
      margin-bottom: 8px;
      border-bottom: 1px solid #ddd;
      padding-bottom: 4px;
    }
    .info-table { width: 100%; border-collapse: collapse; }
    .info-table th, .info-table td { 
      padding: 12px; 
      text-align: left; 
      border-bottom: 1px solid #eee; 
    }
    .info-table th { 
      width: 120px; 
      background: #f9f9f9; 
      font-weight: 600;
    }
    .status { 
      display: inline-block; 
      padding: 4px 12px; 
      border-radius: 999px; 
      font-size: 13px;
      font-weight: 600;
    }
    .status-approved { background: #dcfce7; color: #166534; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-rejected { background: #fee2e2; color: #991b1b; }
    .status-cancelled { background: #f3f4f6; color: #6b7280; }
    .footer { 
      margin-top: 40px; 
      text-align: center; 
      color: #999; 
      font-size: 12px;
      border-top: 1px solid #ddd;
      padding-top: 20px;
    }
    .qr-section { 
      text-align: center; 
      margin: 30px 0; 
      padding: 20px;
      background: #f9f9f9;
      border-radius: 8px;
    }
    .reservation-id { 
      font-family: monospace; 
      font-size: 12px; 
      color: #666;
      margin-top: 8px;
    }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="text-align: center; margin-bottom: 20px;">
    <button onclick="window.print()" style="padding: 10px 24px; font-size: 14px; cursor: pointer;">
      🖨️ 인쇄하기
    </button>
  </div>

  <div class="header">
    <h1>시설물 예약 확인서</h1>
    <p>Facility Reservation Confirmation</p>
  </div>

  <div class="section">
    <div class="section-title">예약 정보</div>
    <table class="info-table">
      <tr>
        <th>시설물</th>
        <td>${reservation.facility?.name || "-"}</td>
      </tr>
      <tr>
        <th>위치</th>
        <td>${reservation.facility?.location || "-"}</td>
      </tr>
      <tr>
        <th>예약 일자</th>
        <td>${formatDate(startAt)}</td>
      </tr>
      <tr>
        <th>예약 시간</th>
        <td>${formatTime(startAt)} ~ ${formatTime(endAt)}</td>
      </tr>
      <tr>
        <th>사용 목적</th>
        <td>${reservation.purpose}</td>
      </tr>
      <tr>
        <th>참석 인원</th>
        <td>${reservation.attendees}명</td>
      </tr>
      <tr>
        <th>예약 상태</th>
        <td>
          <span class="status status-${reservation.status}">
            ${statusLabels[reservation.status] || reservation.status}
          </span>
        </td>
      </tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">신청자 정보</div>
    <table class="info-table">
      <tr>
        <th>이름</th>
        <td>${reservation.applicant_name}</td>
      </tr>
      <tr>
        <th>연락처</th>
        <td>${reservation.applicant_phone}</td>
      </tr>
      ${reservation.applicant_email ? `
      <tr>
        <th>이메일</th>
        <td>${reservation.applicant_email}</td>
      </tr>
      ` : ""}
      ${reservation.applicant_dept ? `
      <tr>
        <th>부서/소속</th>
        <td>${reservation.applicant_dept}</td>
      </tr>
      ` : ""}
      ${reservation.notes ? `
      <tr>
        <th>비고</th>
        <td>${reservation.notes}</td>
      </tr>
      ` : ""}
    </table>
  </div>

  <div class="qr-section">
    <div style="font-size: 14px; color: #666;">예약 번호</div>
    <div class="reservation-id">${reservation.id}</div>
  </div>

  <div class="footer">
    <p>본 확인서는 예약 신청 내역을 확인하는 용도로만 사용됩니다.</p>
    <p>발급일시: ${new Date().toLocaleString("ko-KR")}</p>
  </div>
</body>
</html>
    `;

    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (err: any) {
    return new Response(err.message, { status: 500 });
  }
}
