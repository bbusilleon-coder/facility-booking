"use client";

import { useEffect, useState } from "react";

type TodayReservation = { id: string; purpose: string; start_at: string; end_at: string; applicant_name: string; facility?: { id: string; name: string; location: string | null }; };
type UpcomingReservation = { id: string; purpose: string; start_at: string; end_at: string; applicant_name: string; status: string; facility?: { id: string; name: string }; };
type FacilityStat = { id: string; name: string; count: number; };
type DashboardData = { stats: { totalFacilities: number; todayCount: number; weekCount: number; }; todayReservations: TodayReservation[]; upcomingReservations: UpcomingReservation[]; facilityStats: FacilityStat[]; };

export default function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const fetchDashboard = async () => {
      try { const res = await fetch("/api/dashboard"); const json = await res.json(); if (json.ok) setData(json); }
      catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchDashboard();

    const timer = window.setInterval(() => setCurrentTime(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const formatTime = (dateStr: string) => new Date(dateStr).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  const formatDateTime = (dateStr: string) => new Date(dateStr).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const now = new Date();

  if (loading) return <><div className="ky-status-panel ky-loading-panel" /><div className="ky-dashboard-wide"><div className="ky-loading-block ky-loading-tall" /></div></>;
  if (!data) return null;

  return <>
    <aside className="ky-status-panel">
      <p className="ky-eyebrow">TODAY&apos;S STATUS</p><h2>오늘의 예약 현황</h2>
      <div className="ky-status-date"><strong>{String(now.getDate()).padStart(2, "0")}</strong><span>{now.getFullYear()}.{String(now.getMonth() + 1).padStart(2, "0")}<br />{now.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()}</span></div>
      <div className="ky-status-stats"><div><strong>{data.stats.totalFacilities}</strong><span>등록 시설</span></div><div><strong>{data.stats.todayCount}</strong><span>오늘 예약</span></div><div><strong>{data.stats.weekCount}</strong><span>이번 주</span></div></div>
    </aside>

    <div className="ky-dashboard-wide">
      <section className="ky-reservation-section">
        <div className="ky-section-heading"><div><p className="ky-eyebrow ky-dark">RESERVATION</p><h2>오늘 예약</h2><p>오늘 예약된 강의실과 이용 시간을 한눈에 확인하세요.</p></div><span className="ky-count-badge">총 {data.todayReservations.length}건</span></div>
        {data.todayReservations.length > 0 ? <div className="ky-booking-table" role="table" aria-label="오늘 예약 목록">
          <div className="ky-booking-row ky-table-head" role="row"><span>시설</span><span>예약 내용</span><span>이용 시간</span><span>상태</span></div>
          {data.todayReservations.map((r) => {
            const isFinished = new Date(r.end_at).getTime() <= currentTime;
            return <div className="ky-booking-row" role="row" key={r.id}><strong>{r.facility?.name}</strong><span>{r.purpose}</span><time>{formatTime(r.start_at)} – {formatTime(r.end_at)}</time><em>{isFinished ? "이용 종료" : "이용 예정"}</em></div>;
          })}
        </div> : <div className="ky-empty-message ky-empty-box">오늘 예정된 예약이 없습니다.</div>}
      </section>

      <div className="ky-secondary-grid">
        <section className="ky-upcoming-panel"><div className="ky-panel-title"><div><p className="ky-eyebrow ky-dark">UPCOMING</p><h3>다가오는 예약</h3></div></div>
          {data.upcomingReservations.length > 0 ? <div className="ky-upcoming-list">{data.upcomingReservations.map((r) => <div key={r.id}><span className={`ky-status-dot ${r.status === "approved" ? "approved" : "pending"}`} /><strong>{r.facility?.name}</strong><span>{r.purpose}</span><time>{formatDateTime(r.start_at)}</time></div>)}</div> : <p className="ky-empty-message">다가오는 예약이 없습니다.</p>}
        </section>
        <section className="ky-week-panel"><div className="ky-panel-title"><div><p className="ky-eyebrow ky-dark">THIS WEEK</p><h3>시설별 이용 현황</h3></div></div>
          {data.facilityStats.length > 0 ? <div className="ky-week-list">{data.facilityStats.map((f) => <div key={f.id}><span>{f.name}</span><strong>{f.count}<small>건</small></strong></div>)}</div> : <p className="ky-empty-message">이번 주 예약이 없습니다.</p>}
        </section>
      </div>
    </div>
  </>;
}
