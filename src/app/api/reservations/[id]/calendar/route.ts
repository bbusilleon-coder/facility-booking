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
      return NextResponse.json({ ok: false, message: "예약을 찾을 수 없습니다." }, { status: 404 });
    }

    const startAt = new Date(reservation.start_at);
    const endAt = new Date(reservation.end_at);
    const facilityName = reservation.facility?.name || "시설";
    const location = reservation.facility?.location || "";
    const applicantName = reservation.applicant_name || reservation.booker_name || "";

    // ICS 파일 생성
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//시설물예약시스템//KO
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
DTSTART:${formatICSDate(startAt)}
DTEND:${formatICSDate(endAt)}
DTSTAMP:${formatICSDate(new Date())}
UID:${id}@facility-booking
SUMMARY:${facilityName} 예약
DESCRIPTION:예약자: ${applicantName}\\n목적: ${reservation.purpose || "-"}\\n참석인원: ${reservation.attendees || 1}명
LOCATION:${location}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    return new NextResponse(icsContent, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${facilityName}_${startAt.toISOString().split("T")[0]}.ics"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}
