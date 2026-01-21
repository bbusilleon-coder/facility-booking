import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

// GET: ICS 파일 다운로드
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    const { data: reservation, error } = await supabase
      .from("reservations")
      .select(`
        *,
        facility:facilities(name, location)
      `)
      .eq("id", id)
      .single();

    if (error || !reservation) {
      return NextResponse.json(
        { ok: false, message: "예약을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const startAt = new Date(reservation.start_at);
    const endAt = new Date(reservation.end_at);
    const now = new Date();

    const facilityName = reservation.facility?.name || "시설";
    const location = reservation.facility?.location || "";
    const applicantName = reservation.applicant_name || reservation.booker_name || "";
    const purpose = reservation.purpose || "시설 예약";

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//시설물예약시스템//KO
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${id}@facility-booking
DTSTAMP:${formatICSDate(now)}
DTSTART:${formatICSDate(startAt)}
DTEND:${formatICSDate(endAt)}
SUMMARY:${facilityName} 예약
DESCRIPTION:사용목적: ${purpose}\\n신청자: ${applicantName}
LOCATION:${location}
STATUS:${reservation.status === "approved" ? "CONFIRMED" : "TENTATIVE"}
END:VEVENT
END:VCALENDAR`;

    return new NextResponse(icsContent, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="reservation-${id.slice(0, 8)}.ics"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}
