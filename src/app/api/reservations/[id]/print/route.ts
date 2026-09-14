import { createServerClient } from "@/lib/supabase/server";
import { applySeniorFreeRental } from "@/lib/rental-fee";
import { decodeReservationNotes } from "@/lib/reservation-meta";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const escapeHtml = (value: unknown) =>
  String(value ?? "-")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const formatPhone = (value: string | null | undefined) => {
  const digits = (value || "").replace(/\D/g, "");
  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return value || "-";
};

const statusLabels: Record<string, string> = {
  pending: "승인대기",
  approved: "승인완료",
  rejected: "거절",
  cancelled: "취소",
};

// GET: 총무팀 전자계산서 발행 협조전 붙임용 대관신청서
export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = createServerClient();
    const { data: reservation, error } = await supabase
      .from("reservations")
      .select(`*, facility:facilities(*)`)
      .eq("id", id)
      .single();

    if (error || !reservation) {
      return new Response("예약을 찾을 수 없습니다.", { status: 404 });
    }

    const decoded = decodeReservationNotes(reservation.notes);
    const amount = applySeniorFreeRental(decoded.meta?.calculatedAmount ?? 0, {
      facilityName: reservation.facility?.name,
      applicantName: reservation.applicant_name,
      applicantDept: reservation.applicant_dept,
    });
    const startAt = new Date(reservation.start_at);
    const endAt = new Date(reservation.end_at);
    const applicationDate = new Date(reservation.created_at || Date.now());
    const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
      timeZone: "Asia/Seoul",
    });
    const timeFormatter = new Intl.DateTimeFormat("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Seoul",
    });
    const compactDateFormatter = new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Asia/Seoul",
    });
    const usageDate = dateFormatter.format(startAt);
    const usageTime = `${timeFormatter.format(startAt)} ~ ${timeFormatter.format(endAt)}`;
    const applicationNo = `KLE-${applicationDate.getFullYear()}-${reservation.id.slice(0, 8).toUpperCase()}`;
    const titleDate = startAt.toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
    const pageTitle = `대관신청서_${reservation.facility?.name || "시설"}_${reservation.applicant_name || "신청자"}_${titleDate}`;
    const feeBasis = decoded.meta
      ? `기본 ${decoded.meta.baseHours}시간 ${decoded.meta.baseFee.toLocaleString("ko-KR")}원${decoded.meta.overtimeHours > 0 ? ` + 초과 ${decoded.meta.overtimeHours}시간 × ${decoded.meta.overtimeHourlyFee.toLocaleString("ko-KR")}원` : ""}`
      : "예약 신청 당시 산정 금액";

    const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(pageTitle)}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 28px; background: #eef1f5; color: #111827; font-family: "Malgun Gothic", "Apple SD Gothic Neo", sans-serif; }
    .actions { max-width: 794px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: space-between; gap: 12px; color: #475569; font-size: 13px; }
    .actions button { border: 0; border-radius: 8px; background: #1d4ed8; color: #fff; padding: 11px 22px; font-weight: 700; cursor: pointer; }
    .sheet { width: 100%; max-width: 794px; min-height: 1060px; margin: auto; padding: 44px 48px 36px; background: #fff; box-shadow: 0 12px 36px #0f172a20; }
    .document-meta { display: flex; justify-content: space-between; gap: 16px; padding-bottom: 12px; border-bottom: 1px solid #cbd5e1; color: #64748b; font-size: 11px; }
    h1 { margin: 34px 0 8px; text-align: center; font-size: 30px; letter-spacing: .32em; text-indent: .32em; }
    .subtitle { margin: 0 0 34px; text-align: center; color: #64748b; font-size: 12px; letter-spacing: .08em; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th, td { border: 1px solid #64748b; padding: 11px 12px; font-size: 13px; line-height: 1.55; vertical-align: middle; word-break: break-word; }
    th { width: 18%; background: #f1f5f9; text-align: center; font-weight: 700; }
    td { width: 32%; }
    .section th { background: #dbeafe; color: #1e3a8a; font-size: 14px; letter-spacing: .12em; }
    .amount { text-align: right; font-size: 18px; font-weight: 800; }
    .fee-basis { display: block; margin-top: 4px; color: #64748b; font-size: 11px; font-weight: 400; }
    .statement { margin: 38px 16px 0; text-align: center; font-size: 15px; line-height: 1.9; }
    .application-date { margin-top: 26px; text-align: center; font-size: 14px; }
    .signature { margin: 34px 34px 0 auto; width: 280px; font-size: 14px; }
    .signature-row { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 12px; }
    .sign-space { display: inline-block; min-width: 90px; text-align: right; font-weight: 700; }
    .recipient { margin-top: 52px; text-align: center; font-size: 20px; font-weight: 800; letter-spacing: .04em; }
    .footer { margin-top: 54px; padding-top: 12px; border-top: 1px solid #cbd5e1; color: #64748b; text-align: center; font-size: 10px; line-height: 1.6; }
    .status { font-weight: 700; color: #1d4ed8; }
    @media print {
      body { padding: 0; background: #fff; }
      .actions { display: none; }
      .sheet { max-width: none; min-height: auto; padding: 8mm 9mm 0; box-shadow: none; }
    }
    @media (max-width: 640px) {
      body { padding: 10px; }
      .sheet { min-height: auto; padding: 26px 18px; }
      .document-meta { display: block; }
      .document-meta span { display: block; margin: 3px 0; }
      h1 { font-size: 24px; }
      th, td { padding: 8px 6px; font-size: 11px; }
    }
  </style>
</head>
<body>
  <div class="actions">
    <span>전자계산서 발행 협조전에는 인쇄 화면에서 ‘PDF로 저장’한 파일을 첨부하세요.</span>
    <button type="button" onclick="window.print()">인쇄 · PDF 저장</button>
  </div>
  <main class="sheet">
    <div class="document-meta">
      <span>신청번호 ${escapeHtml(applicationNo)}</span>
      <span>예약상태 <strong class="status">${escapeHtml(statusLabels[reservation.status] || reservation.status)}</strong></span>
    </div>
    <h1>대 관 신 청 서</h1>
    <p class="subtitle">계룡대학습관 시설 사용 신청 내역</p>

    <table aria-label="대관 신청 내역">
      <tbody>
        <tr class="section"><th colspan="4">신청인 정보</th></tr>
        <tr><th>성명</th><td>${escapeHtml(reservation.applicant_name || reservation.booker_name)}</td><th>소속</th><td>${escapeHtml(reservation.applicant_dept)}</td></tr>
        <tr><th>연락처</th><td>${escapeHtml(formatPhone(reservation.applicant_phone || reservation.booker_phone))}</td><th>전자우편</th><td>${escapeHtml(reservation.applicant_email)}</td></tr>
        <tr class="section"><th colspan="4">대관 신청 내용</th></tr>
        <tr><th>시설명</th><td>${escapeHtml(reservation.facility?.name)}</td><th>위치</th><td>${escapeHtml(reservation.facility?.location)}</td></tr>
        <tr><th>사용일</th><td>${escapeHtml(usageDate)}</td><th>사용시간</th><td>${escapeHtml(usageTime)}</td></tr>
        <tr><th>사용목적</th><td colspan="3">${escapeHtml(reservation.purpose)}</td></tr>
        <tr><th>사용인원</th><td>${escapeHtml(`${reservation.attendees || 0}명`)}</td><th>신청일</th><td>${escapeHtml(compactDateFormatter.format(applicationDate))}</td></tr>
        <tr><th>대관료<br>(신청금액)</th><td colspan="3" class="amount">금 ${escapeHtml(amount.toLocaleString("ko-KR"))}원정 (₩${escapeHtml(amount.toLocaleString("ko-KR"))})<span class="fee-basis">${escapeHtml(feeBasis)}</span></td></tr>
        <tr><th>비고</th><td colspan="3">${escapeHtml(decoded.notes)}</td></tr>
      </tbody>
    </table>

    <p class="statement">위와 같이 계룡대학습관 시설 대관을 신청합니다.</p>
    <p class="application-date">${escapeHtml(dateFormatter.format(applicationDate))}</p>
    <div class="signature">
      <div class="signature-row"><span>신청인</span><span class="sign-space">${escapeHtml(reservation.applicant_name || reservation.booker_name)} (서명)</span></div>
    </div>
    <div class="recipient">건양대학교 평생교육원장 귀하</div>
    <div class="footer">계룡대학습관 · 충청남도 계룡시 신도안3길 72 · 042-551-1543<br>본 문서는 전자계산서 발행 협조전의 대관 신청 증빙자료로 사용할 수 있습니다.</div>
  </main>
</body>
</html>`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return new Response(err instanceof Error ? err.message : "신청서 생성 중 오류가 발생했습니다.", { status: 500 });
  }
}
