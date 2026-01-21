"use client";

import { useEffect, useState } from "react";

type Holiday = {
  id: string;
  date: string;
  name: string;
  facility_id: string | null;
  is_recurring: boolean;
  facility?: { id: string; name: string } | null;
};

type Facility = {
  id: string;
  name: string;
};

// 한국 공휴일 (2024-2026)
const koreanHolidays: Record<string, string> = {
  "01-01": "신정",
  "03-01": "삼일절",
  "05-05": "어린이날",
  "06-06": "현충일",
  "08-15": "광복절",
  "10-03": "개천절",
  "10-09": "한글날",
  "12-25": "크리스마스",
};

export default function AdminHolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newHoliday, setNewHoliday] = useState({
    date: "",
    name: "",
    facility_id: "",
    is_recurring: false,
  });

  const fetchHolidays = async () => {
    try {
      const res = await fetch(`/api/holidays?year=${year}`);
      const json = await res.json();
      if (json.ok) {
        setHolidays(json.holidays || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFacilities = async () => {
    try {
      const res = await fetch("/api/facilities");
      const json = await res.json();
      if (json.ok) {
        setFacilities(json.facilities || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHolidays();
    fetchFacilities();
  }, [year]);

  const handleAddHoliday = async () => {
    if (!newHoliday.date || !newHoliday.name) {
      alert("날짜와 이름을 입력해주세요.");
      return;
    }

    try {
      const res = await fetch("/api/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newHoliday,
          facility_id: newHoliday.facility_id || null,
        }),
      });

      const json = await res.json();
      if (json.ok) {
        setShowAddModal(false);
        setNewHoliday({ date: "", name: "", facility_id: "", is_recurring: false });
        fetchHolidays();
      } else {
        alert(json.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/holidays?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.ok) {
        fetchHolidays();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPublicHolidays = async () => {
    if (!confirm(`${year}년 공휴일을 일괄 등록하시겠습니까?`)) return;

    try {
      for (const [monthDay, name] of Object.entries(koreanHolidays)) {
        await fetch("/api/holidays", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: `${year}-${monthDay}`,
            name,
            facility_id: null,
            is_recurring: true,
          }),
        });
      }
      alert("공휴일이 등록되었습니다.");
      fetchHolidays();
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>휴일 관리</h1>
          <p style={{ color: "#888", fontSize: 14, marginTop: 4 }}>
            공휴일 및 특별 휴무일을 관리합니다.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => setYear(year - 1)}
            style={navBtnStyle}
          >
            ◀
          </button>
          <span style={{ fontSize: 18, fontWeight: 700, minWidth: 80, textAlign: "center" }}>{year}년</span>
          <button
            onClick={() => setYear(year + 1)}
            style={navBtnStyle}
          >
            ▶
          </button>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: "10px 20px",
            borderRadius: 10,
            background: "#3b82f6",
            color: "white",
            border: "none",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          + 휴일 추가
        </button>
        <button
          onClick={handleAddPublicHolidays}
          style={{
            padding: "10px 20px",
            borderRadius: 10,
            background: "#1a1a1a",
            color: "#aaa",
            border: "1px solid #333",
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          🇰🇷 {year}년 공휴일 일괄 등록
        </button>
      </div>

      {/* 휴일 목록 */}
      {loading ? (
        <div style={{ color: "#888", padding: 40, textAlign: "center" }}>로딩 중...</div>
      ) : holidays.length === 0 ? (
        <div style={{
          padding: 40,
          background: "#1a1a1a",
          borderRadius: 12,
          textAlign: "center",
          color: "#888",
        }}>
          {year}년에 등록된 휴일이 없습니다.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 12 }}>
          {holidays.map((h) => (
            <div
              key={h.id}
              style={{
                background: "#1a1a1a",
                borderRadius: 10,
                padding: 16,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{h.name}</div>
                <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>
                  {formatDate(h.date)}
                </div>
                {h.facility ? (
                  <div style={{ fontSize: 12, color: "#3b82f6", marginTop: 4 }}>
                    {h.facility.name} 전용
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: "#22c55e", marginTop: 4 }}>
                    전체 시설 적용
                  </div>
                )}
              </div>
              <button
                onClick={() => handleDelete(h.id)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "1px solid #ef4444",
                  background: "transparent",
                  color: "#ef4444",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 휴일 추가 모달 */}
      {showAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            style={{
              background: "#1a1a1a",
              borderRadius: 16,
              padding: 24,
              width: "100%",
              maxWidth: 400,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>휴일 추가</h2>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>날짜 *</label>
              <input
                type="date"
                value={newHoliday.date}
                onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>휴일명 *</label>
              <input
                type="text"
                value={newHoliday.name}
                onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                placeholder="예: 창립기념일"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>적용 시설</label>
              <select
                value={newHoliday.facility_id}
                onChange={(e) => setNewHoliday({ ...newHoliday, facility_id: e.target.value })}
                style={inputStyle}
              >
                <option value="">전체 시설</option>
                {facilities.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={newHoliday.is_recurring}
                  onChange={(e) => setNewHoliday({ ...newHoliday, is_recurring: e.target.checked })}
                />
                매년 반복
              </label>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  flex: 1,
                  padding: "12px",
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
                onClick={handleAddHoliday}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 10,
                  border: "none",
                  background: "#3b82f6",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #333",
  background: "transparent",
  color: "#aaa",
  cursor: "pointer",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 6,
  fontSize: 14,
  color: "#aaa",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #333",
  background: "#0f0f0f",
  color: "white",
  fontSize: 14,
};
