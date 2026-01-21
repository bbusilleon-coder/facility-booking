"use client";

import { useState } from "react";
import Link from "next/link";

type Reservation = {
  id: string;
  start_at: string;
  end_at: string;
  status: string;
  purpose: string;
  applicant_name: string;
  booker_name: string;
  applicant_phone: string;
  booker_phone: string;
  facility: { id: string; name: string; location: string } | null;
};

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: "대기중", color: "#f59e0b" },
  approved: { label: "승인", color: "#22c55e" },
  rejected: { label: "거절", color: "#ef4444" },
  cancelled: { label: "취소", color: "#6b7280" },
};

export default function AdminSearchPage() {
  const [searchType, setSearchType] = useState<"name" | "phone" | "date">("name");
  const [searchValue, setSearchValue] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [results, setResults] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (searchType !== "date" && !searchValue.trim()) return;
    if (searchType === "date" && !dateFrom) return;

    setLoading(true);
    setSearched(true);

    try {
      const params = new URLSearchParams();
      
      if (searchType === "name") {
        params.set("name", searchValue);
      } else if (searchType === "phone") {
        params.set("phone", searchValue);
      } else if (searchType === "date") {
        if (dateFrom) params.set("dateFrom", dateFrom);
        if (dateTo) params.set("dateTo", dateTo);
      }

      const res = await fetch(`/api/reservations/search?${params.toString()}`);
      const json = await res.json();

      if (json.ok) {
        setResults(json.reservations || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("ko-KR", {
      month: "short", day: "numeric", weekday: "short",
      hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>예약 검색</h1>
      <p style={{ color: "#888", marginBottom: 24, fontSize: 14 }}>이름, 연락처, 날짜로 예약을 검색합니다.</p>

      {/* 검색 폼 */}
      <div style={{ background: "#1a1a1a", borderRadius: 16, padding: 24, marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          {(["name", "phone", "date"] as const).map((type) => (
            <button
              key={type}
              onClick={() => { setSearchType(type); setSearchValue(""); setResults([]); setSearched(false); }}
              style={{
                padding: "10px 20px", borderRadius: 10,
                border: searchType === type ? "2px solid var(--color-primary, #3b82f6)" : "2px solid #333",
                background: searchType === type ? "var(--color-primary, #3b82f6)15" : "transparent",
                color: searchType === type ? "var(--color-primary, #3b82f6)" : "#888",
                cursor: "pointer", fontWeight: 600,
              }}
            >
              {type === "name" ? "👤 이름" : type === "phone" ? "📞 연락처" : "📅 날짜"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {searchType !== "date" ? (
            <input
              type={searchType === "phone" ? "tel" : "text"}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder={searchType === "name" ? "예약자 이름 입력" : "연락처 입력 (- 없이)"}
              style={{ flex: 1, minWidth: 200, padding: "12px 14px", borderRadius: 10, border: "1px solid #333", background: "#0f0f0f", color: "white", fontSize: 14 }}
            />
          ) : (
            <>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid #333", background: "#0f0f0f", color: "white", fontSize: 14 }} />
              <span style={{ color: "#888", alignSelf: "center" }}>~</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid #333", background: "#0f0f0f", color: "white", fontSize: 14 }} />
            </>
          )}
          <button
            onClick={handleSearch}
            disabled={loading}
            style={{ padding: "12px 24px", borderRadius: 10, border: "none", background: "var(--color-primary, #3b82f6)", color: "white", cursor: "pointer", fontWeight: 600 }}
          >
            {loading ? "검색 중..." : "🔍 검색"}
          </button>
        </div>
      </div>

      {/* 검색 결과 */}
      {searched && (
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#888" }}>
            검색 결과: {results.length}건
          </h2>

          {results.length === 0 ? (
            <div style={{ padding: 40, background: "#1a1a1a", borderRadius: 12, textAlign: "center", color: "#888" }}>
              검색 결과가 없습니다.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {results.map((r) => (
                <div key={r.id} style={{ background: "#1a1a1a", borderRadius: 12, padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <span style={{ fontWeight: 600 }}>{r.facility?.name || "시설"}</span>
                        <span style={{
                          padding: "2px 8px", borderRadius: 999, fontSize: 11,
                          background: (statusLabels[r.status]?.color || "#888") + "22",
                          color: statusLabels[r.status]?.color || "#888",
                        }}>
                          {statusLabels[r.status]?.label || r.status}
                        </span>
                      </div>
                      <div style={{ fontSize: 14, color: "#aaa", marginBottom: 4 }}>
                        📅 {formatDateTime(r.start_at)} ~ {new Date(r.end_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div style={{ fontSize: 14, color: "#888" }}>
                        👤 {r.applicant_name || r.booker_name || "-"} · 📞 {r.applicant_phone || r.booker_phone || "-"}
                      </div>
                      {r.purpose && <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>목적: {r.purpose}</div>}
                    </div>
                    <Link href={`/admin/reservations?id=${r.id}`}
                      style={{ padding: "8px 16px", borderRadius: 8, background: "#333", color: "#aaa", textDecoration: "none", fontSize: 13 }}>
                      상세보기
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
