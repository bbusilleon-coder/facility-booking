"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DatesSetArg, EventClickArg } from "@fullcalendar/core";

type Facility = {
  id: string;
  name: string;
};

type Reservation = {
  id: string;
  status: string;
  purpose: string;
  attendees: number;
  start_at: string;
  end_at: string;
  applicant_name: string;
  applicant_phone: string;
  applicant_dept: string | null;
  facility_id: string;
  facility?: { id: string; name: string; location: string | null };
};

// 시설물별 색상 팔레트
const facilityColors = [
  "#3b82f6", "#22c55e", "#eab308", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#f97316", "#84cc16", "#6366f1",
];

export default function AdminCalendarPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<string>("all");
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Reservation | null>(null);

  // 시설물별 색상 맵 생성
  const facilityColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    facilities.forEach((f, idx) => {
      map[f.id] = facilityColors[idx % facilityColors.length];
    });
    return map;
  }, [facilities]);

  const fetchReservations = useCallback(async (start: Date, end: Date) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: start.toISOString(),
        to: end.toISOString(),
      });
      
      if (selectedFacility !== "all") {
        params.set("facilityId", selectedFacility);
      }

      const res = await fetch(`/api/admin/calendar?${params.toString()}`);
      const json = await res.json();

      if (json.ok) {
        setFacilities(json.facilities || []);
        
        const statusColors: Record<string, string> = {
          approved: "",  // 시설물 색상 사용
          pending: "#eab308",
        };

        const calendarEvents = (json.reservations || []).map((r: Reservation) => ({
          id: r.id,
          title: `${r.facility?.name || "시설"} - ${r.purpose}`,
          start: r.start_at,
          end: r.end_at,
          backgroundColor: r.status === "pending" ? statusColors.pending : facilityColorMap[r.facility_id] || "#3b82f6",
          borderColor: r.status === "pending" ? statusColors.pending : facilityColorMap[r.facility_id] || "#3b82f6",
          extendedProps: r,
        }));

        setEvents(calendarEvents);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedFacility, facilityColorMap]);

  const handleDatesSet = async (arg: DatesSetArg) => {
    await fetchReservations(arg.start, arg.end);
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    setSelectedEvent(clickInfo.event.extendedProps as Reservation);
  };

  const headerToolbar = useMemo(
    () => ({
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay",
    }),
    []
  );

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("ko-KR", {
      month: "short",
      day: "numeric",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>전체 예약 현황</h1>
        
        {/* 시설물 필터 */}
        <select
          value={selectedFacility}
          onChange={(e) => setSelectedFacility(e.target.value)}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            border: "1px solid #333",
            background: "#1a1a1a",
            color: "white",
            fontSize: 14,
          }}
        >
          <option value="all">전체 시설물</option>
          {facilities.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>

      {/* 범례 */}
      <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
        {facilities.map((f) => (
          <span key={f.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
            <span style={{
              width: 12,
              height: 12,
              borderRadius: 3,
              background: facilityColorMap[f.id] || "#3b82f6",
            }} />
            {f.name}
          </span>
        ))}
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: "#eab308" }} />
          승인대기
        </span>
      </div>

      {/* 캘린더 */}
      <div style={{ background: "#1a1a1a", borderRadius: 12, padding: 16 }}>
        {loading && (
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}>
            로딩 중...
          </div>
        )}
        
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={headerToolbar}
          height="auto"
          locale="ko"
          nowIndicator={true}
          datesSet={handleDatesSet}
          events={events}
          eventClick={handleEventClick}
          slotMinTime="08:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={false}
          eventDisplay="block"
          slotDuration="00:30:00"
        />
      </div>

      {/* 예약 상세 모달 */}
      {selectedEvent && (
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
          onClick={() => setSelectedEvent(null)}
        >
          <div
            style={{
              background: "#1a1a1a",
              borderRadius: 16,
              padding: 24,
              width: "100%",
              maxWidth: 400,
              color: "white",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
              예약 상세
            </h2>

            <div style={{ display: "grid", gap: 12, fontSize: 14 }}>
              <div>
                <span style={{ color: "#888" }}>시설물:</span>{" "}
                <span style={{ fontWeight: 600 }}>{selectedEvent.facility?.name}</span>
              </div>
              <div>
                <span style={{ color: "#888" }}>일시:</span>{" "}
                {formatDate(selectedEvent.start_at)} ~ {formatDate(selectedEvent.end_at)}
              </div>
              <div>
                <span style={{ color: "#888" }}>목적:</span> {selectedEvent.purpose}
              </div>
              <div>
                <span style={{ color: "#888" }}>인원:</span> {selectedEvent.attendees}명
              </div>
              <div>
                <span style={{ color: "#888" }}>신청자:</span> {selectedEvent.applicant_name}
                {selectedEvent.applicant_dept && ` (${selectedEvent.applicant_dept})`}
              </div>
              <div>
                <span style={{ color: "#888" }}>연락처:</span> {selectedEvent.applicant_phone}
              </div>
              <div>
                <span style={{ color: "#888" }}>상태:</span>{" "}
                <span style={{
                  padding: "2px 8px",
                  borderRadius: 999,
                  fontSize: 12,
                  background: selectedEvent.status === "approved" ? "#22c55e22" : "#eab30822",
                  color: selectedEvent.status === "approved" ? "#22c55e" : "#eab308",
                }}>
                  {selectedEvent.status === "approved" ? "승인됨" : "승인대기"}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedEvent(null)}
              style={{
                width: "100%",
                marginTop: 20,
                padding: "12px 16px",
                borderRadius: 10,
                border: "1px solid #444",
                background: "transparent",
                color: "#aaa",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
