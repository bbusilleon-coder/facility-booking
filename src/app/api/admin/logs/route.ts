import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// GET: 활동 로그 조회
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const action = searchParams.get("action");

    const supabase = createServerClient();

    let query = supabase
      .from("admin_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (action) {
      query = query.eq("action", action);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      logs: data || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}

// POST: 활동 로그 기록
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("admin_logs")
      .insert([{
        action: body.action,
        target_type: body.target_type,
        target_id: body.target_id,
        details: body.details || {},
        ip_address: body.ip_address || null,
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      log: data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}
