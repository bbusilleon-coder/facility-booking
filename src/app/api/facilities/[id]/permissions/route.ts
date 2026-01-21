import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: 시설 권한 조회
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("facility_permissions")
      .select(`
        id,
        department:departments(id, name)
      `)
      .eq("facility_id", id);

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      permissions: data || [],
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}

// POST: 시설 권한 설정
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { department_ids, restriction_type } = body; // 'none' or 'department_only'

    const supabase = createServerClient();

    // 시설 제한 타입 업데이트
    await supabase
      .from("facilities")
      .update({ restriction_type: restriction_type || "none" })
      .eq("id", id);

    // 기존 권한 삭제
    await supabase
      .from("facility_permissions")
      .delete()
      .eq("facility_id", id);

    // 새 권한 추가
    if (department_ids && department_ids.length > 0 && restriction_type === "department_only") {
      const permissions = department_ids.map((dept_id: string) => ({
        facility_id: id,
        department_id: dept_id,
      }));

      const { error } = await supabase
        .from("facility_permissions")
        .insert(permissions);

      if (error) throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}
