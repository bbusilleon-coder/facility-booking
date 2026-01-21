import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// GET: 대기열 목록 조회
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const facilityId = searchParams.get("facilityId");
    const phone = searchParams.get("phone");

    const supabase = createServerClient();

    let query = supabase
      .from("waitlist")
      .select(`
        *,
        facility:facilities(id, name)
      `)
      .eq("status", "waiting")
      .order("created_at", { ascending: true });

    if (facilityId) {
      query = query.eq("facility_id", facilityId);
    }

    if (phone) {
      query = query.eq("applicant_phone", phone.replace(/-/g, ""));
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      waitlist: data || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}

// POST: 대기열 등록
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = createServerClient();

    // 이미 대기 중인지 확인
    const { data: existing } = await supabase
      .from("waitlist")
      .select("id")
      .eq("facility_id", body.facility_id)
      .eq("desired_date", body.desired_date)
      .eq("applicant_phone", body.applicant_phone.replace(/-/g, ""))
      .eq("status", "waiting")
      .single();

    if (existing) {
      return NextResponse.json(
        { ok: false, message: "이미 해당 날짜에 대기 신청이 되어 있습니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("waitlist")
      .insert([{
        facility_id: body.facility_id,
        desired_date: body.desired_date,
        desired_start_time: body.desired_start_time,
        desired_end_time: body.desired_end_time,
        applicant_name: body.applicant_name,
        applicant_phone: body.applicant_phone.replace(/-/g, ""),
        applicant_email: body.applicant_email || null,
        purpose: body.purpose,
        attendees: body.attendees || 1,
        status: "waiting",
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      waitlist: data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}

// DELETE: 대기 취소
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { ok: false, message: "ID가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { error } = await supabase
      .from("waitlist")
      .update({ status: "cancelled" })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}
