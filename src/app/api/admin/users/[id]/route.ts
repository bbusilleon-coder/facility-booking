import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT: 관리자 정보 수정
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const supabase = createServerClient();

    const updateData: any = {
      name: body.name,
      email: body.email || null,
      phone: body.phone || null,
      role: body.role,
      is_active: body.is_active,
      updated_at: new Date().toISOString(),
    };

    // 비밀번호 변경이 있는 경우
    if (body.password && body.password.length >= 4) {
      updateData.password_hash = hashPassword(body.password);
    }

    const { data, error } = await supabase
      .from("admins")
      .update(updateData)
      .eq("id", id)
      .select("id, username, name, role, is_active, created_at")
      .single();

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      admin: data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}

// DELETE: 관리자 삭제
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    // 슈퍼관리자 수 확인
    const { data: admin } = await supabase
      .from("admins")
      .select("role")
      .eq("id", id)
      .single();

    if (admin?.role === "super_admin") {
      const { data: superAdmins } = await supabase
        .from("admins")
        .select("id")
        .eq("role", "super_admin")
        .eq("is_active", true);

      if (!superAdmins || superAdmins.length <= 1) {
        return NextResponse.json(
          { ok: false, message: "최소 1명의 슈퍼관리자가 필요합니다." },
          { status: 400 }
        );
      }
    }

    const { error } = await supabase
      .from("admins")
      .delete()
      .eq("id", id);

    if (error) throw error;

    // 세션도 삭제
    await supabase
      .from("admin_sessions")
      .delete()
      .eq("admin_id", id);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}
