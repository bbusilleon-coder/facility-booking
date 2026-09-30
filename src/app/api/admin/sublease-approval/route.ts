import { createServerClient } from "@/lib/supabase/server";
import { applyFreeRental } from "@/lib/rental-fee";
import { decodeReservationNotes } from "@/lib/reservation-meta";

type ReservationRow = {
  id: string;
  start_at: string;
  end_at: string;
  status: string;
  purpose: string | null;
  attendees: number | null;
  applicant_name: string | null;
  applicant_phone: string | null;
  applicant_dept: string | null;
  notes: string | null;
  facility: { name?: string | null; location?: string | null } | Array<{ name?: string | null; location?: string | null }> | null;
};

const escapeHtml = (value: unknown) =>
  String(value ?? "-")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const toKstDateParts = (value: string | Date) => {
  const parts = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  }).formatToParts(new Date(value));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || "";
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute") };
};

const formatDate = (value: string) => {
  const { year, month, day } = toKstDateParts(value);
  return `${year}.${month}.${day}.`;
};

const formatTimeRange = (start: string, end: string) => {
  const startParts = toKstDateParts(start);
  const endParts = toKstDateParts(end);
  return `${startParts.hour}:${startParts.minute}~${endParts.hour}:${endParts.minute}`;
};

const formatPhone = (value: string | null) => {
  const digits = (value || "").replace(/\D/g, "");
  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return value || "-";
};

const addDays = (date: string, days: number) => {
  const result = new Date(`${date}T00:00:00+09:00`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
};

const currentKstMonthRange = () => {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const from = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const nextMonth = new Date(Date.UTC(year, month + 1, 1));
  const to = new Date(nextMonth.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return { from, to };
};

const facilityOf = (row: ReservationRow) => Array.isArray(row.facility) ? row.facility[0] : row.facility;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ids = (searchParams.get("ids") || "").split(",").map((id) => id.trim()).filter(Boolean);
    const defaults = currentKstMonthRange();
    const requestedFrom = searchParams.get("from");
    const requestedTo = searchParams.get("to");
    const from = requestedFrom || requestedTo || defaults.from;
    const to = requestedTo || requestedFrom || defaults.to;
    const supabase = createServerClient();

    let query = supabase
      .from("reservations")
      .select(`
        id, start_at, end_at, status, purpose, attendees,
        applicant_name, applicant_phone, applicant_dept, notes,
        facility:facilities(name, location)
      `)
      .in("status", ["pending", "approved"])
      .order("start_at", { ascending: true });

    if (ids.length > 0) {
      query = query.in("id", ids);
    } else {
      query = query
        .gte("start_at", `${from}T00:00:00+09:00`)
        .lt("start_at", `${addDays(to, 1)}T00:00:00+09:00`);
    }

    const { data, error } = await query;
    if (error) throw error;

    const reservations = (data || []) as ReservationRow[];
    if (reservations.length === 0) {
      return new Response("선택한 조건에 인쇄할 예약이 없습니다.", {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    const firstDate = toKstDateParts(reservations[0].start_at);
    const lastDate = toKstDateParts(reservations[reservations.length - 1].start_at);
    const periodStart = `${firstDate.year}.${firstDate.month}.${firstDate.day}.`;
    const periodEnd = `${lastDate.year}.${lastDate.month}.${lastDate.day}.`;

    const monthlyCounts = new Map<string, number>();
    const recipientNames = new Set<string>();
    const recipientPhones = new Set<string>();
    let totalAmount = 0;

    const detailRows = reservations.map((reservation, index) => {
      const date = toKstDateParts(reservation.start_at);
      const monthKey = `${date.year}.${date.month}`;
      monthlyCounts.set(monthKey, (monthlyCounts.get(monthKey) || 0) + 1);
      const recipient = reservation.applicant_dept || reservation.applicant_name || "미입력";
      recipientNames.add(recipient);
      if (reservation.applicant_phone) recipientPhones.add(formatPhone(reservation.applicant_phone));

      const facility = facilityOf(reservation);
      const decoded = decodeReservationNotes(reservation.notes);
      const amount = applyFreeRental(decoded.meta?.calculatedAmount ?? 0, {
        facilityName: facility?.name,
        applicantName: reservation.applicant_name,
        applicantDept: reservation.applicant_dept,
        isAdminBooking: decoded.meta?.isAdminBooking,
      });
      totalAmount += amount;

      return `<tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(formatDate(reservation.start_at))}<br>${escapeHtml(formatTimeRange(reservation.start_at, reservation.end_at))}</td>
        <td>${escapeHtml(facility?.name)}</td>
        <td class="left">${escapeHtml(recipient)}</td>
        <td class="left">${escapeHtml(reservation.purpose)}</td>
        <td>${escapeHtml(`${reservation.attendees || 0}명`)}</td>
        <td class="amount">${escapeHtml(amount.toLocaleString("ko-KR"))}</td>
      </tr>`;
    }).join("");

    const monthlySummary = Array.from(monthlyCounts.entries())
      .map(([month, count]) => `${month}월 ${count}건`)
      .join(" / ");
    const recipientSummary = recipientNames.size === 1
      ? Array.from(recipientNames)[0]
      : `대관내역 참조 (${recipientNames.size}개 기관·단체)`;
    const phoneSummary = recipientPhones.size === 1 ? Array.from(recipientPhones)[0] : "대관내역 참조";
    const today = toKstDateParts(new Date());
    const pageTitle = `국유재산_전대_승인신청서_${periodStart.replaceAll(".", "-")}_${periodEnd.replaceAll(".", "-")}`;

    const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(pageTitle)}</title>
  <style>
    @page { size: A4 portrait; margin: 10mm; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 24px; background: #edf0f3; color: #111; font-family: "Malgun Gothic", "Apple SD Gothic Neo", sans-serif; }
    .actions { width: 190mm; margin: 0 auto 14px; display: flex; align-items: center; justify-content: space-between; gap: 16px; color: #475569; font-size: 12px; }
    .actions button { border: 0; border-radius: 8px; background: #1d4ed8; color: #fff; padding: 10px 20px; font-weight: 700; cursor: pointer; }
    .sheet { width: 190mm; min-height: 277mm; margin: auto; padding: 10mm 9mm 8mm; background: #fff; box-shadow: 0 10px 32px #0f172a24; }
    h1 { margin: 0 0 7mm; text-align: center; font-size: 25px; letter-spacing: .08em; }
    .legal { margin: 0 0 5mm; text-align: center; font-size: 11px; line-height: 1.55; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th, td { border: 1px solid #999; padding: 2.4mm 2.2mm; font-size: 10.5px; line-height: 1.45; vertical-align: middle; word-break: keep-all; overflow-wrap: anywhere; }
    th { background: #eaf0f7; text-align: center; font-weight: 700; }
    .form-table th { width: 21%; font-size: 11px; }
    .form-table td { width: 79%; }
    .line { display: block; margin: 1.2mm 0; }
    .summary { margin-top: 5mm; }
    .summary th { width: 22%; }
    .details { margin-top: 5mm; }
    .details caption { margin-bottom: 2.5mm; text-align: left; font-size: 12px; font-weight: 700; }
    .details th, .details td { padding: 1.7mm 1.1mm; font-size: 8.5px; text-align: center; word-break: break-all; }
    .details th { background: #eaf0f7; }
    .details .left { text-align: left; }
    .details .amount { text-align: right; white-space: nowrap; }
    .details thead { display: table-header-group; }
    .details tr { break-inside: avoid; page-break-inside: avoid; }
    .total-row td { background: #f8fafc; font-weight: 700; }
    .confirmation { margin: 6mm 0 0; text-align: center; font-size: 10.5px; line-height: 1.6; }
    .date { margin: 4mm 0; text-align: center; font-size: 11px; }
    .sign-table th, .sign-table td { text-align: center; }
    .sign-table th { width: 18%; }
    .stamp-cell { width: 18%; padding: 1.5mm; }
    .stamp { display: block; width: 19mm; height: 19mm; margin: auto; object-fit: contain; }
    .recipient { font-size: 12px; font-weight: 700; }
    @media print {
      body { padding: 0; background: #fff; }
      .actions { display: none; }
      .sheet { width: auto; min-height: auto; padding: 0; box-shadow: none; }
    }
    @media (max-width: 760px) {
      body { padding: 8px; }
      .actions, .sheet { width: 100%; }
      .sheet { padding: 18px 12px; overflow-x: auto; }
    }
  </style>
</head>
<body>
  <div class="actions">
    <span>선택 건, 지정 기간 또는 이번 달 예약을 한 신청서로 묶었습니다.</span>
    <button type="button" onclick="window.print()">인쇄 · PDF 저장</button>
  </div>
  <main class="sheet">
    <h1>국유재산 전대 승인신청서</h1>
    <p class="legal">「국유재산법 시행령」 제26조제1항에 따라 다음과 같이 전대 승인을 신청합니다.</p>

    <table class="form-table" aria-label="국유재산 전대 승인신청 정보">
      <tbody>
        <tr><th>신청인</th><td><span class="line">법인명&nbsp;&nbsp; 건양대학교</span><span class="line">대표자&nbsp;&nbsp; 총장 김용하</span><span class="line">주소&nbsp;&nbsp; (32992) 충청남도 논산시 대학로 121 건양대학교</span></td></tr>
        <tr><th>전대 재산 표시</th><td><span class="line">재산명&nbsp;&nbsp; 계룡대학습관</span><span class="line">소재지&nbsp;&nbsp; 충청남도 계룡시 신도안3길 72 계룡대학습관</span><span class="line">대상시설&nbsp;&nbsp; 계룡대학습관 강의실(대관내역 참조)</span><span class="line">사용허가 근거&nbsp;&nbsp; 충청시설단 재산관리과-553(2020. 2. 4.)호</span></td></tr>
        <tr><th>전대 목적</th><td>교육·연수·회의 등 계룡대학습관의 설치 목적과 교육적 기능에 부합하는 용도의 시설 사용</td></tr>
        <tr><th>사용·수익 방법 및 기간</th><td><span class="line">전대받는 자에게 시설 사용료를 징수하여 시설 운영·관리 및 유지 비용으로 사용</span><span class="line">기간&nbsp;&nbsp; ${escapeHtml(periodStart)} ~ ${escapeHtml(periodEnd)} / 총 ${reservations.length}건</span><span class="line">※ 국유재산 사용허가기간을 초과하지 않는 범위에서 사용</span></td></tr>
        <tr><th>전대받는 자</th><td><span class="line">성명(기관·단체명)&nbsp;&nbsp; ${escapeHtml(recipientSummary)}</span><span class="line">연락처&nbsp;&nbsp; ${escapeHtml(phoneSummary)}</span><span class="line">주소&nbsp;&nbsp; 대관내역 및 예약 신청자료 참조</span></td></tr>
        <tr><th>신청 사유</th><td>계룡대학습관 시설을 효율적으로 활용하고 교육 및 공익 목적의 외부 대관을 운영하기 위하여 전대 승인을 신청합니다.</td></tr>
      </tbody>
    </table>

    <table class="summary" aria-label="월별 신청건수">
      <tbody>
        <tr><th>월별 신청건수</th><td>${escapeHtml(monthlySummary)}</td><th>신청금액 합계</th><td>${escapeHtml(totalAmount.toLocaleString("ko-KR"))}원</td></tr>
      </tbody>
    </table>

    <table class="details" aria-label="대관내역">
      <caption>대관내역</caption>
      <colgroup><col style="width:5%"><col style="width:16%"><col style="width:12%"><col style="width:18%"><col style="width:29%"><col style="width:8%"><col style="width:12%"></colgroup>
      <thead><tr><th>번호</th><th>사용일시</th><th>시설</th><th>기관·단체</th><th>사용목적</th><th>인원</th><th>금액(원)</th></tr></thead>
      <tbody>${detailRows}<tr class="total-row"><td colspan="5">합계</td><td>${reservations.reduce((sum, row) => sum + (row.attendees || 0), 0)}명</td><td class="amount">${escapeHtml(totalAmount.toLocaleString("ko-KR"))}</td></tr></tbody>
    </table>

    <p class="confirmation">위 기재사항이 사실과 다름없음을 확인하며, 관계 법령과 사용허가 조건을 준수하겠습니다.</p>
    <p class="date">${today.year}년 ${today.month}월 ${today.day}일</p>
    <table class="sign-table" aria-label="신청인 및 수신">
      <tbody>
        <tr><th>신청인</th><td>건양대학교 총장 김용하</td><td class="stamp-cell"><img class="stamp" src="/director-stamp.png" alt="건양대학교 평생교육원장 직인"></td></tr>
        <tr><th>수신</th><td colspan="2" class="recipient">____________________________ 귀하</td></tr>
      </tbody>
    </table>
  </main>
</body>
</html>`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return new Response(error instanceof Error ? error.message : "전대 승인신청서 생성 중 오류가 발생했습니다.", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
