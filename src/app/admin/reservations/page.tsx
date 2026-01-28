"use client";

import { useEffect, useState } from "react";

type Reservation = {
  id: string;
  facility_id: string;
  start_at: string;
  end_at: string;
  status: string;
  purpose: string;
  attendees: number;
  applicant_name: string;
  booker_name?: string;
  applicant_phone: string;
  booker_phone?: string;
  applicant_email: string | null;
  applicant_dept: string | null;
  notes: string | null;
  admin_memo: string | null;
  checked_in_at: string | null;
  created_at: string;
  facility?: {
    id: string;
    name: string;
    location: string | null;
  };
};

const statusLabels: Record<string, string> = {
  pending: "승인대기",
  approved: "승인됨",
  rejected: "거절됨",
  cancelled: "취소됨",
};

const statusColors: Record<string, string> = {
  pending: "#eab308",
  approved: "#22c55e",
  rejected: "#ef4444",
  cancelled: "#6b7280",
};

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [adminMemo, setAdminMemo] = useState("");
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendTime, setExtendTime] = useState("");
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyDate, setCopyDate] = useState("");

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.append("status", filter);
      if (search) params.append("search", search);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);

      const res = await fetch(`/api/reservations?${params}`);
      const json = await res.json();
      if (json.ok) {
        setReservations(json.reservations || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [filter]);

  const handleSearch = () => {
    fetchReservations();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말로 이 예약을 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.")) return;

    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.ok) {
        alert("예약이 삭제되었습니다.");
        fetchReservations();
        setSelectedReservation(null);
      } else {
        alert("삭제 실패: " + json.message);
      }
    } catch (err) {
      console.error(err);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const handleStatusChange = async (id: string, status: string, reason?: string) => {
    try {
      const res = await fetch(`/api/reservations/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reason }),
      });
      const json = await res.json();
      if (json.ok) {
        fetchReservations();
        setSelectedReservation(null);
        setAdminMemo("");
      } else {
        alert(json.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExtend = async () => {
    if (!selectedReservation || !extendTime) return;

    try {
      const endDate = selectedReservation.end_at.split("T")[0];
      const newEndAt = `${endDate}T${extendTime}:00`;

      const res = await fetch(`/api/reservations/${selectedReservation.id}/extend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_end_at: newEndAt }),
      });
      const json = await res.json();
      if (json.ok) {
        alert("예약이 연장되었습니다.");
        fetchReservations();
        setShowExtendModal(false);
        setSelectedReservation(null);
      } else {
        alert(json.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopy = async () => {
    if (!selectedReservation || !copyDate) return;

    try {
      const startTime = selectedReservation.start_at.split("T")[1];
      const endTime = selectedReservation.end_at.split("T")[1];
      const newStartAt = `${copyDate}T${startTime}`;
      const newEndAt = `${copyDate}T${endTime}`;

      const res = await fetch(`/api/reservations/${selectedReservation.id}/copy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start_at: newStartAt, end_at: newEndAt }),
      });
      const json = await res.json();
      if (json.ok) {
        alert("예약이 복사되었습니다.");
        fetchReservations();
        setShowCopyModal(false);
        setSelectedReservation(null);
      } else {
        alert(json.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("ko-KR", {
      month: "short",
      day: "numeric",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getName = (r: Reservation) => r.applicant_name || r.booker_name || "-";
  const getPhone = (r: Reservation) => r.applicant_phone || r.booker_phone || "-";

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>예약 관리</h1>

      {/* 검색 및 필터 */}
      <div style={{
        display: "flex",
        gap: 12,
        marginBottom: 24,
        flexWrap: "wrap",
        alignItems: "flex-end",
      }}>
        <div>
          <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 4 }}>검색</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름 또는 연락처"
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #333",
              background: "#1a1a1a",
              color: "white",
              width: 160,
            }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 4 }}>시작일</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #333",
              background: "#1a1a1a",
              color: "white",
            }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 4 }}>종료일</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #333",
              background: "#1a1a1a",
              color: "white",
            }}
          />
        </div>
        <button
          onClick={handleSearch}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            background: "var(--color-primary, #3b82f6)",
            color: "white",
            cursor: "pointer",
          }}
        >
          검색
        </button>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #333",
            background: "#1a1a1a",
            color: "white",
          }}
        >
          <option value="all">전체</option>
          <option value="pending">승인대기</option>
          <option value="approved">승인됨</option>
          <option value="rejected">거절됨</option>
          <option value="cancelled">취소됨</option>
        </select>
      </div>

      {/* 예약 목록 */}
      {loading ? (
        <div style={{ color: "#888", padding: 40, textAlign: "center" }}>로딩 중...</div>
      ) : reservations.length === 0 ? (
        <div style={{ padding: 40, background: "#1a1a1a", borderRadius: 12, textAlign: "center", color: "#888" }}>
          예약이 없습니다.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {reservations.map((r) => (
            <div
              key={r.id}
              style={{
                background: "#1a1a1a",
                borderRadius: 12,
                padding: 16,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
                borderLeft: `4px solid ${statusColors[r.status]}`,
              }}
            >
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{r.facility?.name || "시설"}</span>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 999,
                      fontSize: 11,
                      background: `${statusColors[r.status]}22`,
                      color: statusColors[r.status],
                    }}
                  >
                    {statusLabels[r.status]}
                  </span>
                  {r.checked_in_at && (
                    <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, background: "#22c55e22", color: "#22c55e" }}>
                      체크인완료
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: "#888" }}>
                  {formatDate(r.start_at)} ~ {formatDate(r.end_at)}
                </div>
                <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>
                  {getName(r)} · {getPhone(r)} · {r.purpose || "-"}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {r.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleStatusChange(r.id, "approved")}
                      style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: "#22c55e", color: "white", cursor: "pointer", fontSize: 12 }}
                    >
                      승인
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt("거절 사유를 입력하세요:");
                        if (reason !== null) {
                          handleStatusChange(r.id, "rejected", reason);
                        }
                      }}
                      style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #ef4444", background: "transparent", color: "#ef4444", cursor: "pointer", fontSize: 12 }}
                    >
                      거절
                    </button>
                  </>
                )}
                {r.status === "approved" && (
                  <button
                    onClick={() => {
                      setSelectedReservation(r);
                      setExtendTime(r.end_at.split("T")[1].slice(0, 5));
                      setShowExtendModal(true);
                    }}
                    style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #3b82f6", background: "transparent", color: "#3b82f6", cursor: "pointer", fontSize: 12 }}
                  >
                    연장
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedReservation(r);
                    setCopyDate(r.start_at.split("T")[0]);
                    setShowCopyModal(true);
                  }}
                  style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #888", background: "transparent", color: "#888", cursor: "pointer", fontSize: 12 }}
                >
                  복사
                </button>
                <button
                  onClick={() => setSelectedReservation(r)}
                  style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #444", background: "transparent", color: "#aaa", cursor: "pointer", fontSize: 12 }}
                >
                  상세
                </button>
                {(r.status === "rejected" || r.status === "cancelled") && (
                  <button
                    onClick={() => handleDelete(r.id)}
                    style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #dc2626", background: "#dc262622", color: "#dc2626", cursor: "pointer", fontSize: 12 }}
                  >
                    🗑️ 삭제
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 상세 모달 */}
      {selectedReservation && !showExtendModal && !showCopyModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={() => setSelectedReservation(null)}
        >
          <div
            style={{ background: "#1a1a1a", borderRadius: 16, padding: 24, width: "100%", maxWidth: 500, maxHeight: "80vh", overflow: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>예약 상세</h2>
            
            <div style={{ display: "grid", gap: 12 }}>
              <div><strong>시설:</strong> {selectedReservation.facility?.name}</div>
              <div><strong>일시:</strong> {formatDate(selectedReservation.start_at)} ~ {formatDate(selectedReservation.end_at)}</div>
              <div><strong>신청자:</strong> {getName(selectedReservation)}</div>
              <div><strong>연락처:</strong> {getPhone(selectedReservation)}</div>
              {selectedReservation.applicant_email && <div><strong>이메일:</strong> {selectedReservation.applicant_email}</div>}
              {selectedReservation.applicant_dept && <div><strong>소속:</strong> {selectedReservation.applicant_dept}</div>}
              <div><strong>목적:</strong> {selectedReservation.purpose || "-"}</div>
              <div><strong>인원:</strong> {selectedReservation.attendees}명</div>
              {selectedReservation.notes && <div><strong>비고:</strong> {selectedReservation.notes}</div>}
              <div><strong>상태:</strong> {statusLabels[selectedReservation.status]}</div>
              {selectedReservation.checked_in_at && <div><strong>체크인:</strong> {formatDate(selectedReservation.checked_in_at)}</div>}
              <div><strong>예약번호:</strong> {selectedReservation.id.slice(0, 8).toUpperCase()}</div>
              <div>
                <strong>캘린더 내보내기:</strong>{" "}
                <a href={`/api/reservations/${selectedReservation.id}/ics`} download style={{ color: "var(--color-primary, #3b82f6)" }}>
                  📅 ICS 파일 다운로드
                </a>
              </div>
            </div>

            <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
              <button onClick={() => setSelectedReservation(null)} style={{ flex: 1, padding: 12, borderRadius: 10, border: "1px solid #444", background: "transparent", color: "#aaa", cursor: "pointer" }}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 연장 모달 */}
      {showExtendModal && selectedReservation && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={() => setShowExtendModal(false)}
        >
          <div
            style={{ background: "#1a1a1a", borderRadius: 16, padding: 24, width: "100%", maxWidth: 400 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>예약 연장</h2>
            <p style={{ color: "#888", fontSize: 14, marginBottom: 16 }}>
              {selectedReservation.facility?.name}<br />
              현재 종료: {formatDate(selectedReservation.end_at)}
            </p>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "#aaa" }}>새 종료 시간</label>
              <input
                type="time"
                value={extendTime}
                onChange={(e) => setExtendTime(e.target.value)}
                style={{ width: "100%", padding: "12px", borderRadius: 8, border: "1px solid #333", background: "#0f0f0f", color: "white" }}
              />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setShowExtendModal(false)} style={{ flex: 1, padding: 12, borderRadius: 10, border: "1px solid #444", background: "transparent", color: "#aaa", cursor: "pointer" }}>
                취소
              </button>
              <button onClick={handleExtend} style={{ flex: 1, padding: 12, borderRadius: 10, border: "none", background: "var(--color-primary, #3b82f6)", color: "white", cursor: "pointer", fontWeight: 600 }}>
                연장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 복사 모달 */}
      {showCopyModal && selectedReservation && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={() => setShowCopyModal(false)}
        >
          <div
            style={{ background: "#1a1a1a", borderRadius: 16, padding: 24, width: "100%", maxWidth: 400 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>예약 복사</h2>
            <p style={{ color: "#888", fontSize: 14, marginBottom: 16 }}>
              {selectedReservation.facility?.name}<br />
              원본: {formatDate(selectedReservation.start_at)} ~ {formatDate(selectedReservation.end_at)}
            </p>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "#aaa" }}>새 예약 날짜</label>
              <input
                type="date"
                value={copyDate}
                onChange={(e) => setCopyDate(e.target.value)}
                style={{ width: "100%", padding: "12px", borderRadius: 8, border: "1px solid #333", background: "#0f0f0f", color: "white" }}
              />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setShowCopyModal(false)} style={{ flex: 1, padding: 12, borderRadius: 10, border: "1px solid #444", background: "transparent", color: "#aaa", cursor: "pointer" }}>
                취소
              </button>
              <button onClick={handleCopy} style={{ flex: 1, padding: 12, borderRadius: 10, border: "none", background: "var(--color-primary, #3b82f6)", color: "white", cursor: "pointer", fontWeight: 600 }}>
                복사
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
