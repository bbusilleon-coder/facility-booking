import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: 예약 확인서 HTML 생성
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
      return new NextResponse("예약을 찾을 수 없습니다.", { status: 404 });
    }

    const formatDate = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.toLocaleString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    const statusLabels: Record<string, string> = {
      pending: "승인대기",
      approved: "승인완료",
      rejected: "거절됨",
      cancelled: "취소됨",
    };

    const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>예약 확인서</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
      color: #333;
    }
    .header {
      text-align: center;
      border-bottom: 3px double #333;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      font-size: 28px;
      margin-bottom: 10px;
    }
    .header .subtitle {
      color: #666;
      font-size: 14px;
    }
    .status {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: bold;
      margin-top: 10px;
    }
    .status.approved { background: #dcfce7; color: #166534; }
    .status.pending { background: #fef9c3; color: #854d0e; }
    .status.rejected { background: #fee2e2; color: #991b1b; }
    .status.cancelled { background: #f3f4f6; color: #6b7280; }
    .section {
      margin-bottom: 24px;
    }
    .section-title {
      font-size: 14px;
      color: #666;
      margin-bottom: 8px;
      border-left: 3px solid #3b82f6;
      padding-left: 10px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .info-item {
      padding: 12px 16px;
      background: #f9fafb;
      border-radius: 8px;
    }
    .info-item.full { grid-column: span 2; }
    .info-label {
      font-size: 12px;
      color: #888;
      margin-bottom: 4px;
    }
    .info-value {
      font-size: 15px;
      font-weight: 500;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      color: #888;
      font-size: 12px;
    }
    .qr-section {
      text-align: center;
      margin-top: 30px;
      padding: 20px;
      background: #f9fafb;
      border-radius: 12px;
    }
    .reservation-id {
      font-family: monospace;
      font-size: 12px;
      color: #888;
      margin-top: 10px;
    }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
    .print-btn {
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 24px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>시설 예약 확인서</h1>
    <p class="subtitle">Facility Reservation Confirmation</p>
    <span class="status ${reservation.status}">${statusLabels[reservation.status] || reservation.status}</span>
  </div>

  <div class="section">
    <div class="section-title">시설 정보</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">시설명</div>
        <div class="info-value">${reservation.facility?.name || "-"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">위치</div>
        <div class="info-value">${reservation.facility?.location || "-"}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">예약 정보</div>
    <div class="info-grid">
      <div class="info-item full">
        <div class="info-label">예약 일시</div>
        <div class="info-value">${formatDate(reservation.start_at)} ~ ${formatDate(reservation.end_at)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">사용 목적</div>
        <div class="info-value">${reservation.purpose}</div>
      </div>
      <div class="info-item">
        <div class="info-label">예상 인원</div>
        <div class="info-value">${reservation.attendees}명</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">신청자 정보</div>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">신청자</div>
        <div class="info-value">${reservation.applicant_name}</div>
      </div>
      <div class="info-item">
        <div class="info-label">연락처</div>
        <div class="info-value">${reservation.applicant_phone}</div>
      </div>
      <div class="info-item">
        <div class="info-label">부서/소속</div>
        <div class="info-value">${reservation.applicant_dept || "-"}</div>
      </div>
      <div class="info-item">
        <div class="info-label">이메일</div>
        <div class="info-value">${reservation.applicant_email || "-"}</div>
      </div>
    </div>
  </div>

  ${reservation.notes ? `
  <div class="section">
    <div class="section-title">비고</div>
    <div class="info-grid">
      <div class="info-item full">
        <div class="info-value">${reservation.notes}</div>
      </div>
    </div>
  </div>
  ` : ""}

  <div class="qr-section">
    <div style="font-size: 14px; color: #666;">예약 확인 번호</div>
    <div style="font-size: 24px; font-weight: bold; margin-top: 8px; letter-spacing: 2px;">
      ${reservation.id.substring(0, 8).toUpperCase()}
    </div>
    <div class="reservation-id">ID: ${reservation.id}</div>
  </div>

  <div class="footer">
    <p>본 확인서는 예약 확인 용도로만 사용됩니다.</p>
    <p style="margin-top: 4px;">발급일시: ${new Date().toLocaleString("ko-KR")}</p>
  </div>

  <button class="print-btn no-print" onclick="window.print()">🖨️ 인쇄하기</button>
</body>
</html>
    `;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (err: any) {
    return new NextResponse(err.message, { status: 500 });
  }
}
