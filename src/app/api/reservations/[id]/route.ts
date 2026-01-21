import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: 예약 상세 조회
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("reservations")
      .select(`
        *,
        facility:facilities(id, name, location)
      `)
      .eq("id", id)
      .single();

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      reservation: data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}

// PUT: 예약 수정
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const supabase = createServerClient();

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.start_at !== undefined) updateData.start_at = body.start_at;
    if (body.end_at !== undefined) updateData.end_at = body.end_at;
    if (body.purpose !== undefined) updateData.purpose = body.purpose;
    if (body.attendees !== undefined) updateData.attendees = body.attendees;
    if (body.applicant_name !== undefined) updateData.applicant_name = body.applicant_name;
    if (body.applicant_phone !== undefined) updateData.applicant_phone = body.applicant_phone;
    if (body.applicant_email !== undefined) updateData.applicant_email = body.applicant_email;
    if (body.applicant_dept !== undefined) updateData.applicant_dept = body.applicant_dept;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.admin_memo !== undefined) updateData.admin_memo = body.admin_memo;

    const { data, error } = await supabase
      .from("reservations")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      reservation: data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}

// DELETE: 예약 삭제
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    const { error } = await supabase
      .from("reservations")
      .delete()
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
