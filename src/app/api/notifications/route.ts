import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// 이메일 발송 함수 (실제 발송은 SMTP 설정 필요)
async function sendEmail(to: string, subject: string, html: string) {
  // TODO: nodemailer 또는 외부 서비스 연동
  // 현재는 발송 기록만 저장
  console.log(`[Email] To: ${to}, Subject: ${subject}`);
  return true;
}

// POST: 알림 발송
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, recipient, subject, content, related_type, related_id } = body;
    
    const supabase = createServerClient();

    // 알림 기록 저장
    const { data: notification, error } = await supabase
      .from("notifications")
      .insert([{
        type: type || "email",
        recipient,
        subject,
        content,
        related_type,
        related_id,
        status: "pending",
      }])
      .select()
      .single();

    if (error) throw error;

    // 이메일 발송 시도
    if (type === "email" && recipient) {
      try {
        await sendEmail(recipient, subject, content);
        
        await supabase
          .from("notifications")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", notification.id);
      } catch (emailError: any) {
        await supabase
          .from("notifications")
          .update({ status: "failed", error_message: emailError.message })
          .eq("id", notification.id);
      }
    }

    return NextResponse.json({ ok: true, notification });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}

// GET: 알림 기록 조회
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status");

    const supabase = createServerClient();

    let query = supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ ok: true, notifications: data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}
