"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type TodayReservation = {
  id: string;
  purpose: string;
  start_at: string;
  end_at: string;
  applicant_name: string;
  facility?: { id: string; name: string; location: string | null };
};

type UpcomingReservation = {
  id: string;
  purpose: string;
  start_at: string;
  end_at: string;
  applicant_name: string;
  status: string;
  facility?: { id: string; name: string };
};

type FacilityStat = {
  id: string;
  name: string;
  count: number;
};

type DashboardData = {
  stats: {
    totalFacilities: number;
    todayCount: number;
    weekCount: number;
  };
  todayReservations: TodayReservation[];
  upcomingReservations: UpcomingReservation[];
  facilityStats: FacilityStat[];
};

export default function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch("/api/dashboard");
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

    fetchDashboard();
  }, []);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div>
      {/* 통계 카드 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 24 }}>
        <div style={{
          background: "#1a1a1a",
          borderRadius: 12,
          padding: 16,
          borderLeft: "4px solid #3b82f6",
        }}>
          <div style={{ color: "#888", fontSize: 12, marginBottom: 4 }}>등록된 시설물</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{data.stats.totalFacilities}</div>
        </div>
        
        <div style={{
          background: "#1a1a1a",
          borderRadius: 12,
          padding: 16,
          borderLeft: "4px solid #22c55e",
        }}>
          <div style={{ color: "#888", fontSize: 12, marginBottom: 4 }}>오늘 예약</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#22c55e" }}>{data.stats.todayCount}</div>
        </div>
        
        <div style={{
          background: "#1a1a1a",
          borderRadius: 12,
          padding: 16,
          borderLeft: "4px solid #8b5cf6",
        }}>
          <div style={{ color: "#888", fontSize: 12, marginBottom: 4 }}>이번 주 예약</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{data.stats.weekCount}</div>
        </div>
      </div>

      {/* 오늘 예약 */}
      {data.todayReservations.length > 0 && (
        <div style={{ background: "#1a1a1a", borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "#22c55e" }}>
            📅 오늘 예약 ({data.todayReservations.length}건)
          </h3>
          <div style={{ display: "grid", gap: 8 }}>
            {data.todayReservations.map((r) => (
              <div
                key={r.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 12px",
                  background: "#0f0f0f",
                  borderRadius: 8,
                  fontSize: 13,
                }}
              >
                <div>
                  <span style={{ fontWeight: 600 }}>{r.facility?.name}</span>
                  <span style={{ color: "#888", marginLeft: 8 }}>{r.purpose}</span>
                </div>
                <div style={{ color: "#888" }}>
                  {formatTime(r.start_at)} - {formatTime(r.end_at)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 다가오는 예약 */}
      {data.upcomingReservations.length > 0 && (
        <div style={{ background: "#1a1a1a", borderRadius: 12, padding: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
            ⏰ 다가오는 예약
          </h3>
          <div style={{ display: "grid", gap: 8 }}>
            {data.upcomingReservations.map((r) => (
              <div
                key={r.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 12px",
                  background: "#0f0f0f",
                  borderRadius: 8,
                  fontSize: 13,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: r.status === "approved" ? "#22c55e" : "#eab308",
                    }}
                  />
                  <span style={{ fontWeight: 600 }}>{r.facility?.name}</span>
                  <span style={{ color: "#888" }}>{r.purpose}</span>
                </div>
                <div style={{ color: "#888", fontSize: 12 }}>
                  {formatDateTime(r.start_at)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 시설물별 이번 주 이용 현황 */}
      {data.facilityStats.length > 0 && (
        <div style={{ background: "#1a1a1a", borderRadius: 12, padding: 16, marginTop: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
            🏢 이번 주 시설물 이용 현황
          </h3>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {data.facilityStats.map((f) => (
              <div
                key={f.id}
                style={{
                  padding: "8px 14px",
                  background: "#0f0f0f",
                  borderRadius: 8,
                  fontSize: 13,
                }}
              >
                <span style={{ fontWeight: 600 }}>{f.name}</span>
                <span style={{ color: "#3b82f6", marginLeft: 8 }}>{f.count}건</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
