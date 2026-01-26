"use client";

import React, { useMemo, useState, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateSelectArg, DatesSetArg } from "@fullcalendar/core";
import type { DateClickArg } from "@fullcalendar/interaction";
import ReservationModal from "./reservation/ReservationModal";
import RecurringReservationModal from "./reservation/RecurringReservationModal";

type Props = {
  facilityId: string;
  facilityName: string;
  openTime?: string;
  closeTime?: string;
  closedDays?: number[];
};

type ReservationPublic = {
  id: string;
  facility_id: string;
  start_at: string;
  end_at: string;
  status: string;
};

export default function FacilityCalendar({ 
  facilityId, 
  facilityName,
  openTime = "09:00",
  closeTime = "22:00",
  closedDays = [],
}: Props) {
  const [selectedRange, setSelectedRange] = useState<{ start: Date; end: Date } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [events, setEvents] = useState<
    { id: string; title: string; start: string; end: string; color?: string }[]
  >([]);
  const [loading, setLoading] = useState(false);

  const headerToolbar = useMemo(() => ({
    left: "prev,next",
    center: "title",
    right: "dayGridMonth,timeGridWeek,timeGridDay",
  }), []);

  const handleDateClick = useCallback((arg: DateClickArg) => {
    if (closedDays.includes(arg.date.getDay())) {
      alert("해당 요일은 휴무일입니다.");
      return;
    }
    
    const start = arg.date;
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    setSelectedRange({ start, end });
    setIsModalOpen(true);
  }, [closedDays]);

  const handleSelect = useCallback((selectInfo: DateSelectArg) => {
    if (closedDays.includes(selectInfo.start.getDay())) {
      alert("해당 요일은 휴무일입니다.");
      selectInfo.view.calendar.unselect();
      return;
    }

    setSelectedRange({ start: selectInfo.start, end: selectInfo.end });
    setIsModalOpen(true);
    selectInfo.view.calendar.unselect();
  }, [closedDays]);

  const fetchReservations = useCallback(async (start: Date, end: Date) => {
    setLoading(true);
    try {
      const from = start.toISOString();
      const to = end.toISOString();

      const res = await fetch(
        `/api/reservations/public?facilityId=${facilityId}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        { cache: "no-store" }
      );

      if (!res.ok) {
        setEvents([]);
        return;
      }

      const json = await res.json();
      const rows: ReservationPublic[] = json.reservations ?? [];

      const statusColors: Record<string, string> = {
        approved: "#22c55e",
        pending: "#eab308",
        rejected: "#ef4444",
        cancelled: "#6b7280",
      };

      setEvents(
        rows.map((r) => ({
          id: r.id,
          title: r.status === "approved" ? "예약확정" : r.status === "pending" ? "승인대기" : "예약",
          start: r.start_at,
          end: r.end_at,
          color: statusColors[r.status] || "#3b82f6",
        }))
      );
    } finally {
      setLoading(false);
    }
  }, [facilityId]);

  const handleDatesSet = useCallback(async (arg: DatesSetArg) => {
    await fetchReservations(arg.start, arg.end);
  }, [fetchReservations]);

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedRange(null);
  };

  const handleReservationSuccess = useCallback(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    fetchReservations(start, end);
  }, [fetchReservations]);

  const dayCellClassNames = useCallback((arg: { date: Date }) => {
    if (closedDays.includes(arg.date.getDay())) {
      return ["fc-day-closed"];
    }
    return [];
  }, [closedDays]);

  return (
    <div>
      <style>{`
        .fc-day-closed {
          background: #1a1a1a !important;
          opacity: 0.5;
        }
        .fc-highlight {
          background: rgba(59, 130, 246, 0.3) !important;
        }
        .fc .fc-toolbar {
          flex-wrap: wrap;
          gap: 8px;
        }
        .fc .fc-toolbar-title {
          font-size: 16px !important;
        }
        .fc .fc-button {
          padding: 6px 10px !important;
          font-size: 12px !important;
        }
        .fc-timegrid-slot {
          height: 36px !important;
        }
        .fc-event {
          cursor: default;
          font-size: 11px !important;
        }
        @media (max-width: 640px) {
          .fc .fc-toolbar {
            flex-direction: column;
          }
          .fc .fc-toolbar-title {
            font-size: 14px !important;
          }
          .fc-timegrid-slot {
            height: 32px !important;
          }
        }
      `}</style>

      <div style={{ 
        display: "flex", 
        justifyContent: "space-between",
        alignItems: "flex-start",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 16 
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>📅 예약 달력</h2>
            {loading && (
              <span style={{ fontSize: 12, color: "#888" }}>로딩 중...</span>
            )}
          </div>
          <p style={{ color: "#777", fontSize: 12, margin: "4px 0 0" }}>
            날짜/시간을 클릭하거나 드래그하여 예약
          </p>
        </div>

        {/* 정기 예약 버튼 */}
        <button
          onClick={() => setIsRecurringModalOpen(true)}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "1px solid #8b5cf6",
            background: "transparent",
            color: "#8b5cf6",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          🔄 정기 예약
        </button>
      </div>

      {/* 범례 */}
      <div style={{ 
        display: "flex", 
        gap: 12, 
        marginBottom: 12, 
        fontSize: 12,
        flexWrap: "wrap",
      }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: "#22c55e" }} />
          예약확정
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: "#eab308" }} />
          승인대기
        </span>
      </div>

      <div style={{ 
        background: "#1a1a1a", 
        borderRadius: 12, 
        padding: 12,
        overflow: "hidden",
      }}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={headerToolbar}
          height="auto"
          locale="ko"
          nowIndicator={true}
          selectable={true}
          selectMirror={true}
          select={handleSelect}
          dateClick={handleDateClick}
          datesSet={handleDatesSet}
          events={events}
          slotMinTime={openTime + ":00"}
          slotMaxTime={closeTime + ":00"}
          allDaySlot={false}
          eventDisplay="block"
          slotDuration="00:30:00"
          dayCellClassNames={dayCellClassNames}
          selectAllow={(selectInfo) => !closedDays.includes(selectInfo.start.getDay())}
          longPressDelay={150}
          eventTimeFormat={{
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }}
        />
      </div>

      {/* 단일 예약 모달 */}
      <ReservationModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        facilityId={facilityId}
        facilityName={facilityName}
        selectedStart={selectedRange?.start || null}
        selectedEnd={selectedRange?.end || null}
        onSuccess={handleReservationSuccess}
      />

      {/* 정기 예약 모달 */}
      <RecurringReservationModal
        isOpen={isRecurringModalOpen}
        onClose={() => setIsRecurringModalOpen(false)}
        facilityId={facilityId}
        facilityName={facilityName}
        onSuccess={handleReservationSuccess}
      />
    </div>
  );
}
