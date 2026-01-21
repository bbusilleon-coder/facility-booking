import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import crypto from "crypto";

// 비밀번호 해싱
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// GET: 비밀번호 설정 여부 확인
export async function GET() {
  try {
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from("admin_settings")
      .select("*")
      .eq("key", "admin_password")
      .single();

    // 설정이 없으면 초기 비밀번호 생성
    if (error || !data) {
      const initialPassword = hashPassword("1234");
      
      await supabase
        .from("admin_settings")
        .upsert({
          key: "admin_password",
          value: initialPassword,
          updated_at: new Date().toISOString(),
        });

      return NextResponse.json({
        ok: true,
        isInitial: true,
        message: "초기 비밀번호가 설정되었습니다. (1234)",
      });
    }

    return NextResponse.json({
      ok: true,
      isInitial: false,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}

// POST: 비밀번호 변경
export async function POST(req: Request) {
  try {
    const { currentPassword, newPassword } = await req.json();
    const supabase = createServerClient();

    // 현재 비밀번호 확인
    const { data: settings } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "admin_password")
      .single();

    const currentHash = hashPassword(currentPassword);
    const storedHash = settings?.value || hashPassword("1234");

    if (currentHash !== storedHash) {
      return NextResponse.json(
        { ok: false, message: "현재 비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    // 새 비밀번호 저장
    const newHash = hashPassword(newPassword);
    
    const { error } = await supabase
      .from("admin_settings")
      .upsert({
        key: "admin_password",
        value: newHash,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      message: "비밀번호가 변경되었습니다.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}
