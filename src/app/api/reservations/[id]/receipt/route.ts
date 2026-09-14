import { createServerClient } from "@/lib/supabase/server";
import { getRentalPricing } from "@/lib/rental-fee";
import { decodeReservationNotes } from "@/lib/reservation-meta";

interface RouteParams { params: Promise<{ id: string }> }

const escapeHtml = (value: unknown) => String(value ?? "-")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

export async function GET(_req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = createServerClient();
    const { data: reservation, error } = await supabase
      .from("reservations")
      .select(`*, facility:facilities(*)`)
      .eq("id", id)
      .single();

    if (error || !reservation) return new Response("예약을 찾을 수 없습니다.", { status: 404 });
    if (reservation.status !== "approved") return new Response("승인된 예약만 영수증을 발급할 수 있습니다.", { status: 400 });

    const startAt = new Date(reservation.start_at);
    const endAt = new Date(reservation.end_at);
    const decoded = decodeReservationNotes(reservation.notes);
    const pricing = getRentalPricing(reservation.facility || {});
    // Do not retroactively apply today's pricing to legacy reservations.
    // Only an amount captured when the reservation was created is receiptable.
    const amount = decoded.meta?.calculatedAmount ?? 0;
    const issueDate = new Date();
    const date = startAt.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Seoul" });
    const time = `${startAt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul" })} ~ ${endAt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul" })}`;
    const receiptNo = `KLE-${issueDate.getFullYear()}-${reservation.id.slice(0, 8).toUpperCase()}`;

    const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>시설사용료 영수증</title>
<style>
*{box-sizing:border-box}body{font-family:"Malgun Gothic",sans-serif;color:#1f2937;margin:0;background:#f3f4f6;padding:32px}.sheet{max-width:760px;margin:auto;background:#fff;padding:52px 58px;box-shadow:0 12px 40px #0002}.actions{text-align:center;margin-bottom:20px}.actions button{border:0;border-radius:8px;background:#1d4ed8;color:#fff;padding:11px 22px;font-weight:700;cursor:pointer}h1{text-align:center;font-size:30px;letter-spacing:.18em;margin:10px 0 38px}.meta{display:flex;justify-content:space-between;font-size:13px;color:#6b7280;margin-bottom:12px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #9ca3af;padding:13px 14px;font-size:14px}th{width:22%;background:#f8fafc;text-align:center}td{width:28%}.amount{font-size:22px;font-weight:800;text-align:right}.note{margin:28px 0;color:#4b5563;font-size:13px;line-height:1.7}.issuer{text-align:right;margin-top:48px;position:relative;padding-right:18px;font-weight:700;font-size:18px}.issuer img{width:74px;height:74px;object-fit:contain;position:absolute;right:0;top:50%;transform:translateY(-50%);opacity:.9}.issuer span{position:relative;z-index:1;margin-right:34px}.footer{text-align:center;margin-top:55px;padding-top:14px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:11px}@media print{body{background:#fff;padding:0}.sheet{box-shadow:none;max-width:none}.actions{display:none}}@media(max-width:640px){body{padding:10px}.sheet{padding:28px 20px}.meta{display:block}.meta span{display:block;margin:4px 0}th,td{padding:9px 7px;font-size:12px}}
</style></head><body><div class="actions"><button onclick="window.print()">인쇄·PDF 저장</button></div><main class="sheet">
<h1>시설사용료 영수증</h1><div class="meta"><span>영수증 번호 ${escapeHtml(receiptNo)}</span><span>발급일 ${escapeHtml(issueDate.toLocaleDateString("ko-KR"))}</span></div>
<table><tbody>
<tr><th>신청자</th><td>${escapeHtml(reservation.applicant_name)}</td><th>소속</th><td>${escapeHtml(reservation.applicant_dept || "-")}</td></tr>
<tr><th>시설명</th><td>${escapeHtml(reservation.facility?.name)}</td><th>위치</th><td>${escapeHtml(reservation.facility?.location || "-")}</td></tr>
<tr><th>사용일</th><td>${escapeHtml(date)}</td><th>사용시간</th><td>${escapeHtml(time)}</td></tr>
<tr><th>사용목적</th><td colspan="3">${escapeHtml(reservation.purpose)}</td></tr>
<tr><th>사용금액</th><td colspan="3" class="amount">금 ${amount.toLocaleString("ko-KR")}원정 (₩${amount.toLocaleString("ko-KR")})</td></tr>
</tbody></table>
<p class="note">위 금액을 계룡대학습관 시설 사용료로 확인합니다.<br>기본 ${pricing.baseHours}시간 요금 및 초과 사용시간을 기준으로 자동 산정되었습니다.</p>
<div class="issuer"><span>건양대학교 평생교육원장</span><img src="/director-stamp.png" alt="건양대학교 평생교육원장 직인"></div>
<div class="footer">계룡대학습관 · 충남 계룡시 신도안3길 72 · 042-551-1543</div>
</main></body></html>`;

    return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
  } catch (err) {
    return new Response(err instanceof Error ? err.message : "영수증 발급 중 오류가 발생했습니다.", { status: 500 });
  }
}
