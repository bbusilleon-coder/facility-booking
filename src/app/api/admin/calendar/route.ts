import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const facilityId = searchParams.get("facilityId");

    const supabase = createServerClient();

    let query = supabase
      .from("reservations")
      .select(`
        id, status, purpose, attendees,
        start_at, end_at,
        applicant_name, applicant_phone, applicant_dept,
        facility_id,
        facility:facilities(id, name, location)
      `)
      .in("status", ["pending", "approved"]);

    if (from) {
      query = query.gte("start_at", from);
    }
    if (to) {
      query = query.lte("start_at", to);
    }
    if (facilityId && facilityId !== "all") {
      query = query.eq("facility_id", facilityId);
    }

    const { data, error } = await query.order("start_at", { ascending: true });

    if (error) throw error;

    // 시설물 목록도 함께 반환
    const { data: facilities } = await supabase
      .from("facilities")
      .select("id, name")
      .eq("is_active", true)
      .order("name");

    return NextResponse.json({
      ok: true,
      reservations: data,
      facilities: facilities || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}
