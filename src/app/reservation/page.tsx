"use client";

import { useState } from "react";
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
  const [searchType, setSearchType] = useState<"phone" | "email">("phone");
  const [searchValue, setSearchValue] = useState("");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handlePrint = (id: string) => {
    window.open(`/api/reservations/${id}/print`, "_blank");
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: 24, color: "white" }}>
      <Link href="/" style={{ color: "#3b82f6", fontSize: 14 }}>← 시설물 목록</Link>

      <h1 style={{ fontSize: 28, fontWeight: 800, marginTop: 12, marginBottom: 8 }}>
        내 예약 조회
      </h1>
      <p style={{ color: "#888", marginBottom: 24 }}>
        예약 시 입력한 연락처 또는 이메일로 조회합니다.
      </p>

      {/* 검색 폼 */}
      <form onSubmit={handleSearch} style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <input
              type="radio"
              name="searchType"
              checked={searchType === "phone"}
              onChange={() => setSearchType("phone")}
            />
            연락처
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <input
              type="radio"
              name="searchType"
              checked={searchType === "email"}
              onChange={() => setSearchType("email")}
            />
            이메일
          </label>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <input
            type={searchType === "email" ? "email" : "tel"}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder={searchType === "phone" ? "010-0000-0000" : "example@email.com"}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 10,
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
              borderRadius: 10,
              border: "none",
              background: "#3b82f6",
              color: "white",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {loading ? "조회 중..." : "조회"}
          </button>
        </div>
      </form>

      {/* 에러 */}
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

      {/* 결과 */}
      {searched && !loading && (
        <>
          {reservations.length === 0 ? (
            <div style={{
              padding: 24,
              border: "1px solid #333",
              borderRadius: 12,
              textAlign: "center",
              color: "#888",
            }}>
              예약 내역이 없습니다.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {reservations.map((r) => (
                <div
                  key={r.id}
                  style={{
                    border: "1px solid #333",
                    borderRadius: 12,
                    padding: 16,
                    background: "#1a1a1a",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>
                        {r.facility?.name || "시설물"}
                      </div>
                      <div style={{ color: "#888", fontSize: 13, marginTop: 4 }}>
                        {r.facility?.location}
                      </div>
                    </div>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 600,
                        background: statusColors[r.status] + "22",
                        color: statusColors[r.status],
                        border: `1px solid ${statusColors[r.status]}44`,
                      }}
                    >
                      {statusLabels[r.status] || r.status}
                    </span>
                  </div>

                  <div style={{ fontSize: 14, color: "#ccc", marginBottom: 8 }}>
                    <div>📅 {formatDate(r.start_at)} ~ {formatDate(r.end_at)}</div>
                    <div>📋 {r.purpose} · {r.attendees}명</div>
                  </div>

                  <div style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>
                    신청일: {formatDate(r.created_at)}
                  </div>

                  {/* 버튼 영역 */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {/* 인쇄 버튼 - 승인된 예약만 */}
                    {r.status === "approved" && (
                      <button
                        onClick={() => handlePrint(r.id)}
                        style={{
                          padding: "8px 16px",
                          borderRadius: 8,
                          border: "1px solid #22c55e",
                          background: "transparent",
                          color: "#22c55e",
                          cursor: "pointer",
                          fontSize: 13,
                        }}
                      >
                        🖨️ 확인서 출력
                      </button>
                    )}

                    {/* 수정/취소 - 승인대기 상태만 */}
                    {r.status === "pending" && (
                      <>
                        <Link
                          href={`/reservation/${r.id}`}
                          style={{
                            padding: "8px 16px",
                            borderRadius: 8,
                            border: "1px solid #3b82f6",
                            background: "transparent",
                            color: "#3b82f6",
                            textDecoration: "none",
                            fontSize: 13,
                          }}
                        >
                          수정
                        </Link>
                        <button
                          onClick={() => handleCancel(r.id)}
                          style={{
                            padding: "8px 16px",
                            borderRadius: 8,
                            border: "1px solid #ef4444",
                            background: "transparent",
                            color: "#ef4444",
                            cursor: "pointer",
                            fontSize: 13,
                          }}
                        >
                          취소
                        </button>
                      </>
                    )}

                    {/* 재예약 - 취소/거절된 경우 */}
                    {(r.status === "cancelled" || r.status === "rejected") && (
                      <Link
                        href={`/facilities/${r.facility_id}?copy=${r.id}`}
                        style={{
                          padding: "8px 16px",
                          borderRadius: 8,
                          border: "1px solid #8b5cf6",
                          background: "transparent",
                          color: "#8b5cf6",
                          textDecoration: "none",
                          fontSize: 13,
                        }}
                      >
                        🔄 재예약
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
