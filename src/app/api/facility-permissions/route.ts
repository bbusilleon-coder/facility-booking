import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// GET: 시설별 허용 부서 목록 조회
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const facilityId = searchParams.get("facilityId");

    const supabase = createServerClient();

    let query = supabase
      .from("facility_permissions")
      .select(`
        *,
        facility:facilities(id, name)
      `);

    if (facilityId) {
      query = query.eq("facility_id", facilityId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      permissions: data || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}

// POST: 시설 권한 설정
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { facility_id, departments, is_restricted } = body;

    const supabase = createServerClient();

    // 기존 권한 삭제
    await supabase
      .from("facility_permissions")
      .delete()
      .eq("facility_id", facility_id);

    // 새 권한 추가 (is_restricted가 true이고 departments가 있는 경우만)
    if (is_restricted && departments && departments.length > 0) {
      const permissionsData = departments.map((dept: string) => ({
        facility_id,
        department: dept,
      }));

      const { error } = await supabase
        .from("facility_permissions")
        .insert(permissionsData);

      if (error) throw error;
    }

    // 시설 테이블에 제한 여부 업데이트
    await supabase
      .from("facilities")
      .update({ is_restricted: is_restricted || false })
      .eq("id", facility_id);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}

// 부서 권한 체크 함수 (예약 시 사용)
export async function checkDepartmentPermission(
  supabase: any,
  facilityId: string,
  department: string | null
): Promise<{ allowed: boolean; message?: string }> {
  // 시설 정보 조회
  const { data: facility } = await supabase
    .from("facilities")
    .select("is_restricted")
    .eq("id", facilityId)
    .single();

  // 제한이 없으면 모두 허용
  if (!facility?.is_restricted) {
    return { allowed: true };
  }

  // 부서가 없으면 거부
  if (!department) {
    return { allowed: false, message: "이 시설은 특정 부서만 예약 가능합니다. 소속/부서를 입력해주세요." };
  }

  // 허용된 부서인지 확인
  const { data: permissions } = await supabase
    .from("facility_permissions")
    .select("department")
    .eq("facility_id", facilityId);

  if (!permissions || permissions.length === 0) {
    return { allowed: true };
  }

  const allowedDepts = permissions.map((p: any) => p.department.toLowerCase());
  const userDept = department.toLowerCase();

  if (allowedDepts.some((d: string) => userDept.includes(d) || d.includes(userDept))) {
    return { allowed: true };
  }

  return { 
    allowed: false, 
    message: `이 시설은 다음 부서만 예약 가능합니다: ${permissions.map((p: any) => p.department).join(", ")}` 
  };
}
