"use client";

import { useState, useMemo, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateClickArg, EventClickArg } from "@fullcalendar/interaction";
import type { DatesSetArg, EventInput } from "@fullcalendar/core";
import { Reservation, RESERVATION_STATUS_COLORS } from "@/types";

interface ReservationCalendarProps {
  facilityId: string;
  onDateSelect?: (start: Date, end: Date) => void;
  onEventClick?: (reservation: Reservation) => void;
  selectable?: boolean;
}

export function ReservationCalendar({
  facilityId,
  onDateSelect,
  onEventClick,
  selectable = true,
}: ReservationCalendarProps) {
  const [events, setEvents] = useState<EventInput[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);

  const headerToolbar = useMemo(
    () => ({
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay",
    }),
    []
  );

  const fetchReservations = useCallback(async (from: string, to: string) => {
    try {
      const res = await fetch(
        `/api/reservations/public?facilityId=${facilityId}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
        { cache: "no-store" }
      );

      if (!res.ok) {
        setEvents([]);
        return;
      }

      const json = await res.json();
      const rows: Reservation[] = json.reservations ?? [];
      setReservations(rows);

      setEvents(
        rows.map((r) => ({
          id: r.id,
          title: r.status === "approved" ? "예약됨" : r.status === "pending" ? "승인대기" : "취소됨",
          start: r.start_at,
          end: r.end_at,
          backgroundColor: r.status === "approved" ? "#3b82f6" : r.status === "pending" ? "#f59e0b" : "#9ca3af",
          borderColor: r.status === "approved" ? "#2563eb" : r.status === "pending" ? "#d97706" : "#6b7280",
          extendedProps: { reservation: r },
        }))
      );
    } catch {
      setEvents([]);
    }
  }, [facilityId]);

  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    fetchReservations(arg.start.toISOString(), arg.end.toISOString());
  }, [fetchReservations]);

  const handleDateClick = useCallback((arg: DateClickArg) => {
    if (!selectable || !onDateSelect) return;
    const start = arg.date;
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 기본 1시간
    onDateSelect(start, end);
  }, [selectable, onDateSelect]);

  const handleEventClick = useCallback((arg: EventClickArg) => {
    const reservation = arg.event.extendedProps.reservation as Reservation;
    if (onEventClick && reservation) {
      onEventClick(reservation);
    }
  }, [onEventClick]);

  return (
    <div className="bg-white rounded-xl border p-4">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={headerToolbar}
        height="auto"
        locale="ko"
        nowIndicator
        selectable={false}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        datesSet={handleDatesSet}
        events={events}
        slotMinTime="08:00:00"
        slotMaxTime="22:00:00"
        allDaySlot={false}
        weekends={true}
        slotDuration="00:30:00"
        eventTimeFormat={{
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }}
      />
      
      {/* 범례 */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span className="text-gray-600">예약됨</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-amber-500" />
          <span className="text-gray-600">승인대기</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-gray-400" />
          <span className="text-gray-600">취소/거절</span>
        </div>
      </div>
    </div>
  );
}
