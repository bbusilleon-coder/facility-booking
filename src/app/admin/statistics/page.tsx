"use client";

import { useEffect, useState } from "react";

type MonthlyStats = {
  month: number;
  total: number;
  approved: number;
  rejected: number;
  cancelled: number;
  pending: number;
};

type FacilityStats = {
  id: string;
  name: string;
  total: number;
  approved: number;
  totalHours: number;
  totalAttendees: number;
};

type StatusSummary = {
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  cancelled: number;
};

type StatsData = {
  year: number;
  monthlyStats: MonthlyStats[];
  facilityStats: FacilityStats[];
  statusSummary: StatusSummary;
};

export default function StatisticsPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StatsData | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/statistics?year=${year}`);
        const json = await res.json();
        if (json.ok) {
          setData(json);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [year]);

  const monthLabels = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

  // 차트용 최대값 계산
  const maxMonthlyTotal = data ? Math.max(...data.monthlyStats.map(m => m.total), 1) : 1;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>통계</h1>
        
        {/* 연도 선택 */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => setYear(y => y - 1)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #333",
              background: "transparent",
              color: "#aaa",
              cursor: "pointer",
            }}
          >
            ◀
          </button>
          <span style={{ fontSize: 18, fontWeight: 700, minWidth: 60, textAlign: "center" }}>
            {year}년
          </span>
          <button
            onClick={() => setYear(y => y + 1)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #333",
              background: "transparent",
              color: "#aaa",
              cursor: "pointer",
            }}
          >
            ▶
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ color: "#888", padding: 40, textAlign: "center" }}>로딩 중...</div>
      ) : data ? (
        <>
          {/* 요약 카드 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 32 }}>
            {[
              { label: "전체", value: data.statusSummary.total, color: "#3b82f6" },
              { label: "승인", value: data.statusSummary.approved, color: "#22c55e" },
              { label: "대기", value: data.statusSummary.pending, color: "#eab308" },
              { label: "거절", value: data.statusSummary.rejected, color: "#ef4444" },
              { label: "취소", value: data.statusSummary.cancelled, color: "#6b7280" },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  background: "#1a1a1a",
                  borderRadius: 12,
                  padding: 16,
                  textAlign: "center",
                }}
              >
                <div style={{ color: "#888", fontSize: 13, marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* 월별 예약 차트 */}
          <div style={{ background: "#1a1a1a", borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>월별 예약 현황</h2>
            
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 200 }}>
              {data.monthlyStats.map((m, idx) => {
                const height = (m.total / maxMonthlyTotal) * 160;
                const approvedHeight = (m.approved / maxMonthlyTotal) * 160;
                
                return (
                  <div key={idx} style={{ flex: 1, textAlign: "center" }}>
                    <div style={{ position: "relative", height: 160, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                      {/* 전체 바 */}
                      <div
                        style={{
                          height: height || 2,
                          background: "#333",
                          borderRadius: "4px 4px 0 0",
                          position: "relative",
                        }}
                      >
                        {/* 승인 바 */}
                        <div
                          style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: approvedHeight,
                            background: "#22c55e",
                            borderRadius: m.approved === m.total ? "4px 4px 0 0" : "0",
                          }}
                        />
                      </div>
                      
                      {/* 숫자 표시 */}
                      {m.total > 0 && (
                        <div style={{
                          position: "absolute",
                          top: -20,
                          left: 0,
                          right: 0,
                          fontSize: 11,
                          color: "#888",
                        }}>
                          {m.total}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: "#666", marginTop: 8 }}>{monthLabels[idx]}</div>
                  </div>
                );
              })}
            </div>
            
            {/* 범례 */}
            <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 16, fontSize: 12 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 12, height: 12, background: "#22c55e", borderRadius: 2 }} />
                승인
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 12, height: 12, background: "#333", borderRadius: 2 }} />
                기타
              </span>
            </div>
          </div>

          {/* 시설물별 이용률 */}
          <div style={{ background: "#1a1a1a", borderRadius: 12, padding: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>시설물별 이용 현황</h2>
            
            {data.facilityStats.length === 0 ? (
              <div style={{ color: "#888", padding: 20, textAlign: "center" }}>
                시설물 데이터가 없습니다.
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #333" }}>
                    <th style={{ textAlign: "left", padding: "10px 12px", color: "#888", fontSize: 13 }}>시설물</th>
                    <th style={{ textAlign: "right", padding: "10px 12px", color: "#888", fontSize: 13 }}>총 예약</th>
                    <th style={{ textAlign: "right", padding: "10px 12px", color: "#888", fontSize: 13 }}>승인</th>
                    <th style={{ textAlign: "right", padding: "10px 12px", color: "#888", fontSize: 13 }}>승인율</th>
                    <th style={{ textAlign: "right", padding: "10px 12px", color: "#888", fontSize: 13 }}>총 이용시간</th>
                    <th style={{ textAlign: "right", padding: "10px 12px", color: "#888", fontSize: 13 }}>총 이용인원</th>
                  </tr>
                </thead>
                <tbody>
                  {data.facilityStats.map((f) => {
                    const approvalRate = f.total > 0 ? Math.round((f.approved / f.total) * 100) : 0;
                    
                    return (
                      <tr key={f.id} style={{ borderBottom: "1px solid #222" }}>
                        <td style={{ padding: "12px", fontWeight: 600 }}>{f.name}</td>
                        <td style={{ padding: "12px", textAlign: "right" }}>{f.total}건</td>
                        <td style={{ padding: "12px", textAlign: "right", color: "#22c55e" }}>{f.approved}건</td>
                        <td style={{ padding: "12px", textAlign: "right" }}>
                          <span style={{
                            padding: "2px 8px",
                            borderRadius: 999,
                            fontSize: 12,
                            background: approvalRate >= 80 ? "#22c55e22" : approvalRate >= 50 ? "#eab30822" : "#ef444422",
                            color: approvalRate >= 80 ? "#22c55e" : approvalRate >= 50 ? "#eab308" : "#ef4444",
                          }}>
                            {approvalRate}%
                          </span>
                        </td>
                        <td style={{ padding: "12px", textAlign: "right", color: "#888" }}>
                          {f.totalHours.toFixed(1)}시간
                        </td>
                        <td style={{ padding: "12px", textAlign: "right", color: "#888" }}>
                          {f.totalAttendees}명
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        <div style={{ color: "#888", padding: 40, textAlign: "center" }}>
          데이터를 불러올 수 없습니다.
        </div>
      )}
    </div>
  );
}
