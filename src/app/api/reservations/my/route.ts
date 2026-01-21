import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// GET: 내 예약 조회 (전화번호 또는 이메일로)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");
    const email = searchParams.get("email");

    if (!phone && !email) {
      return NextResponse.json(
        { ok: false, message: "전화번호 또는 이메일을 입력해주세요." },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    let query = supabase
      .from("reservations")
      .select(`
        *,
        facility:facilities(id, name, location)
      `)
      .order("created_at", { ascending: false });

    if (phone) {
      // 전화번호 검색 (하이픈 제거 후 비교)
      const normalizedPhone = phone.replace(/-/g, "");
      query = query.or(
        `applicant_phone.eq.${phone},applicant_phone.eq.${normalizedPhone}`
      );
    }

    if (email) {
      query = query.eq("applicant_email", email);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      reservations: data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}
