import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createServerClient();
    
    const { data } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "notification_email")
      .single();

    return NextResponse.json({ 
      ok: true, 
      email: data?.value || "",
    });
  } catch {
    return NextResponse.json({ ok: true, email: "" });
  }
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const supabase = createServerClient();

    await supabase
      .from("admin_settings")
      .upsert({ key: "notification_email", value: email }, { onConflict: "key" });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}
