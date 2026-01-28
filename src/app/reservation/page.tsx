"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Reservation = {
  id: string;
  facility_id: string;
  start_at: string;
  end_at: string;
  status: string;
  purpose: string;
  attendees: number;
  applicant_name: string;
  applicant_phone: string;
  applicant_email: string | null;
  applicant_dept: string | null;
  notes: string | null;
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

export default function MyReservationPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  
  const [searchType, setSearchType] = useState<"phone" | "email">("email");
  const [searchValue, setSearchValue] = useState("");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 수정 모달
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [editForm, setEditForm] = useState({
    purpose: "",
    attendees: 1,
    notes: "",
  });
  const [editLoading, setEditLoading] = useState(false);

  // 로그인 상태 확인 및 자동 조회
  useEffect(() => {
    const token = localStorage.getItem("userToken");
    const expiresAt = localStorage.getItem("userExpiresAt");
    const name = localStorage.getItem("userName");
    const email = localStorage.getItem("userEmail");

    if (token && expiresAt && new Date(expiresAt) > new Date() && email) {
      setIsLoggedIn(true);
      setUserName(name || "");
      setUserEmail(email);
      setSearchValue(email);
      // 자동으로 예약 조회
      fetchReservations(email);
    }
  }, []);

  const fetchReservations = async (email: string) => {
    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const res = await fetch(`/api/reservations/my?email=${encodeURIComponent(email)}`);
      const json = await res.json();

      if (!json.ok) {
        throw new Error(json.message || "조회 실패");
      }

      setReservations(json.reservations || []);
    } catch (err: any) {
      setError(err.message);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const params = new URLSearchParams();
      if (searchType === "phone") {
        params.set("phone", searchValue.trim());
      } else {
        params.set("email", searchValue.trim());
      }

      const res = await fetch(`/api/reservations/my?${params.toString()}`);
      const json = await res.json();

      if (!json.ok) {
        throw new Error(json.message || "조회 실패");
      }

      setReservations(json.reservations || []);
    } catch (err: any) {
      setError(err.message);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("예약을 취소하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/reservations/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });

      const json = await res.json();
      if (!json.ok) throw new Error(json.message);

      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r))
      );
      alert("예약이 취소되었습니다.");
    } catch (err: any) {
      alert("취소 실패: " + err.message);
    }
  };

  const openEditModal = (reservation: Reservation) => {
    setEditingReservation(reservation);
    setEditForm({
      purpose: reservation.purpose,
      attendees: reservation.attendees,
      notes: reservation.notes || "",
    });
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReservation) return;

    setEditLoading(true);

    try {
      const res = await fetch(`/api/reservations/${editingReservation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      const json = await res.json();
      if (!json.ok) throw new Error(json.message);

      // 목록 업데이트
      setReservations((prev) =>
        prev.map((r) =>
          r.id === editingReservation.id
            ? { ...r, ...editForm }
            : r
        )
      );

      alert("예약이 수정되었습니다.");
      setEditingReservation(null);
    } catch (err: any) {
      alert("수정 실패: " + err.message);
    } finally {
      setEditLoading(false);
    }
  };

  // 로컬 시간 문자열을 올바르게 파싱
  const parseLocalDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    
    // UTC 형식(Z 또는 +포함)이 아니면 로컬 시간으로 직접 파싱
    if (!dateStr.includes("Z") && !dateStr.includes("+")) {
      const [datePart, timePart] = dateStr.split("T");
      if (!datePart || !timePart) return new Date(dateStr);
      
      const [year, month, day] = datePart.split("-").map(Number);
      const [hour, minute] = timePart.split(":").map(Number);
      
      return new Date(year, month - 1, day, hour, minute);
    }
    
    return new Date(dateStr);
  };

  const formatDateTime = (dateStr: string) => {
    const date = parseLocalDate(dateStr);
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateTimeShort = (dateStr: string) => {
    const date = parseLocalDate(dateStr);
    return date.toLocaleString("ko-KR", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 예약 분류
  const now = new Date();
  const upcomingReservations = reservations
    .filter((r) => new Date(r.start_at) >= now && r.status !== "cancelled" && r.status !== "rejected")
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
  
  const pastReservations = reservations
    .filter((r) => new Date(r.start_at) < now || r.status === "cancelled" || r.status === "rejected")
    .sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime());

  return (
    <div style={{ minHeight: "100vh", background: "var(--background, #0a0a0a)", padding: 24 }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <Link href="/" style={{ color: "var(--text-muted, #888)", fontSize: 13, textDecoration: "none" }}>
          ← 홈으로 돌아가기
        </Link>

        <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 16, marginBottom: 8, color: "white" }}>
          내 예약 조회
        </h1>

        {/* 로그인 사용자 정보 */}
        {isLoggedIn && (
          <div style={{
            background: "var(--color-primary-light, #3b82f622)",
            border: "1px solid var(--color-primary, #3b82f6)",
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <span style={{ fontSize: 16 }}>👤</span>
            <span style={{ color: "var(--color-primary, #3b82f6)", fontWeight: 600 }}>
              {userName}
            </span>
            <span style={{ color: "var(--text-muted, #888)", fontSize: 13 }}>
              ({userEmail})
            </span>
            <span style={{ color: "var(--text-muted, #888)", fontSize: 13, marginLeft: "auto" }}>
              로그인됨 - 예약 자동 조회
            </span>
          </div>
        )}

        {/* 비로그인 시 검색 폼 */}
        {!isLoggedIn && (
          <form onSubmit={handleSearch} style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <button
                type="button"
                onClick={() => setSearchType("phone")}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "1px solid #333",
                  background: searchType === "phone" ? "#3b82f6" : "transparent",
                  color: searchType === "phone" ? "white" : "#888",
                  cursor: "pointer",
                }}
              >
                전화번호
              </button>
              <button
                type="button"
                onClick={() => setSearchType("email")}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "1px solid #333",
                  background: searchType === "email" ? "#3b82f6" : "transparent",
                  color: searchType === "email" ? "white" : "#888",
                  cursor: "pointer",
                }}
              >
                이메일
              </button>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <input
                type={searchType === "email" ? "email" : "tel"}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={searchType === "phone" ? "010-0000-0000" : "example@email.com"}
                required
                style={{
                  flex: 1,
                  padding: "12px 14px",
                  borderRadius: 8,
                  border: "1px solid #333",
                  background: "#0f0f0f",
                  color: "white",
                  fontSize: 14,
                }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "12px 24px",
                  borderRadius: 8,
                  border: "none",
                  background: "#3b82f6",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                {loading ? "조회 중..." : "조회"}
              </button>
            </div>

            <p style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
              💡 로그인하면 자동으로 예약 현황을 확인할 수 있습니다.{" "}
              <Link href="/auth" style={{ color: "#3b82f6" }}>로그인하기</Link>
            </p>
          </form>
        )}

        {/* 로그인 시 새로고침 버튼 */}
        {isLoggedIn && (
          <div style={{ marginBottom: 16 }}>
            <button
              onClick={() => fetchReservations(userEmail)}
              disabled={loading}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "1px solid #333",
                background: "transparent",
                color: "#888",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              {loading ? "조회 중..." : "🔄 새로고침"}
            </button>
          </div>
        )}

        {error && (
          <div style={{
            background: "#3a1a1a",
            border: "1px solid #f44",
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            color: "#faa",
          }}>
            {error}
          </div>
        )}

        {/* 예약 현황 요약 */}
        {searched && !loading && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: 12,
            marginBottom: 24,
          }}>
            <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#3b82f6" }}>{reservations.length}</div>
              <div style={{ fontSize: 12, color: "#888" }}>전체 예약</div>
            </div>
            <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#eab308" }}>
                {reservations.filter(r => r.status === "pending").length}
              </div>
              <div style={{ fontSize: 12, color: "#888" }}>승인대기</div>
            </div>
            <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#22c55e" }}>
                {reservations.filter(r => r.status === "approved").length}
              </div>
              <div style={{ fontSize: 12, color: "#888" }}>승인됨</div>
            </div>
            <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#22c55e" }}>
                {upcomingReservations.length}
              </div>
              <div style={{ fontSize: 12, color: "#888" }}>예정된 예약</div>
            </div>
          </div>
        )}

        {/* 예정된 예약 */}
        {upcomingReservations.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: "white" }}>
              📅 예정된 예약 ({upcomingReservations.length}건)
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {upcomingReservations.map((r) => (
                <ReservationCard
                  key={r.id}
                  reservation={r}
                  onCancel={handleCancel}
                  onEdit={openEditModal}
                  formatDateTime={formatDateTime}
                  isUpcoming={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* 지난 예약 */}
        {pastReservations.length > 0 && (
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: "#888" }}>
              📋 지난 예약 ({pastReservations.length}건)
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {pastReservations.map((r) => (
                <ReservationCard
                  key={r.id}
                  reservation={r}
                  onCancel={handleCancel}
                  onEdit={openEditModal}
                  formatDateTime={formatDateTime}
                  isUpcoming={false}
                />
              ))}
            </div>
          </div>
        )}

        {/* 결과 없음 */}
        {searched && !loading && reservations.length === 0 && (
          <div style={{
            textAlign: "center",
            padding: 48,
            color: "#888",
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <p>예약 내역이 없습니다.</p>
            <Link
              href="/"
              style={{
                display: "inline-block",
                marginTop: 16,
                padding: "10px 20px",
                background: "#3b82f6",
                color: "white",
                borderRadius: 8,
                textDecoration: "none",
              }}
            >
              예약하러 가기
            </Link>
          </div>
        )}

        {/* 수정 모달 */}
        {editingReservation && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: 16,
            }}
            onClick={() => setEditingReservation(null)}
          >
            <div
              style={{
                background: "#1a1a1a",
                borderRadius: 16,
                padding: 24,
                width: "100%",
                maxWidth: 450,
                color: "white",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
                예약 수정
              </h2>

              <div style={{
                background: "#0f0f0f",
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
                fontSize: 13,
                color: "#888",
              }}>
                <div><strong style={{ color: "#aaa" }}>{editingReservation.facility?.name}</strong></div>
                <div>{formatDateTime(editingReservation.start_at)}</div>
              </div>

              <form onSubmit={handleEdit}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "#aaa" }}>
                    사용 목적 *
                  </label>
                  <input
                    type="text"
                    value={editForm.purpose}
                    onChange={(e) => setEditForm({ ...editForm, purpose: e.target.value })}
                    required
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "#aaa" }}>
                    참석 인원 *
                  </label>
                  <input
                    type="number"
                    value={editForm.attendees}
                    onChange={(e) => setEditForm({ ...editForm, attendees: parseInt(e.target.value) || 1 })}
                    required
                    min={1}
                    style={inputStyle}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "#aaa" }}>
                    비고
                  </label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    rows={3}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => setEditingReservation(null)}
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      borderRadius: 10,
                      border: "1px solid #444",
                      background: "transparent",
                      color: "#aaa",
                      cursor: "pointer",
                    }}
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      borderRadius: 10,
                      border: "none",
                      background: editLoading ? "#444" : "#3b82f6",
                      color: "white",
                      cursor: editLoading ? "not-allowed" : "pointer",
                      fontWeight: 600,
                    }}
                  >
                    {editLoading ? "수정 중..." : "수정 완료"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 예약 카드 컴포넌트
function ReservationCard({
  reservation,
  onCancel,
  onEdit,
  formatDateTime,
  isUpcoming,
}: {
  reservation: Reservation;
  onCancel: (id: string) => void;
  onEdit: (r: Reservation) => void;
  formatDateTime: (d: string) => string;
  isUpcoming: boolean;
}) {
  const canModify = isUpcoming && (reservation.status === "pending" || reservation.status === "approved");

  return (
    <div
      style={{
        background: isUpcoming ? "#1a1a1a" : "#111",
        borderRadius: 12,
        padding: 16,
        border: isUpcoming ? "1px solid #333" : "1px solid #222",
        opacity: isUpcoming ? 1 : 0.7,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: "white", marginBottom: 4 }}>
            {reservation.facility?.name || "시설"}
          </div>
          <div style={{ fontSize: 13, color: "#888" }}>
            {reservation.facility?.location}
          </div>
        </div>
        <span
          style={{
            padding: "4px 10px",
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
            background: statusColors[reservation.status] + "22",
            color: statusColors[reservation.status],
          }}
        >
          {statusLabels[reservation.status]}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13, marginBottom: 12 }}>
        <div>
          <span style={{ color: "#666" }}>시작: </span>
          <span style={{ color: "#aaa" }}>{formatDateTime(reservation.start_at)}</span>
        </div>
        <div>
          <span style={{ color: "#666" }}>종료: </span>
          <span style={{ color: "#aaa" }}>{formatDateTime(reservation.end_at)}</span>
        </div>
        <div>
          <span style={{ color: "#666" }}>목적: </span>
          <span style={{ color: "#aaa" }}>{reservation.purpose}</span>
        </div>
        <div>
          <span style={{ color: "#666" }}>인원: </span>
          <span style={{ color: "#aaa" }}>{reservation.attendees}명</span>
        </div>
      </div>

      {reservation.notes && (
        <div style={{ fontSize: 12, color: "#666", marginBottom: 12 }}>
          📝 {reservation.notes}
        </div>
      )}

      {canModify && (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => onEdit(reservation)}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "1px solid #3b82f6",
              background: "transparent",
              color: "#3b82f6",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            ✏️ 수정
          </button>
          <button
            onClick={() => onCancel(reservation.id)}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "1px solid #ef4444",
              background: "transparent",
              color: "#ef4444",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            ❌ 취소
          </button>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #333",
  background: "#0f0f0f",
  color: "white",
  fontSize: 14,
};
