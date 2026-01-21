import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createServerClient();
    
    const { data: themeData } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "theme")
      .single();

    const { data: modeData } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "theme_mode")
      .single();

    return NextResponse.json({ 
      ok: true, 
      theme: themeData?.value || "blue",
      mode: modeData?.value || "dark",
    });
  } catch {
    return NextResponse.json({ ok: true, theme: "blue", mode: "dark" });
  }
}

export async function POST(req: Request) {
  try {
    const { theme, mode } = await req.json();
    const supabase = createServerClient();

    if (theme) {
      await supabase
        .from("admin_settings")
        .upsert({ key: "theme", value: theme }, { onConflict: "key" });
    }

    if (mode) {
      await supabase
        .from("admin_settings")
        .upsert({ key: "theme_mode", value: mode }, { onConflict: "key" });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}
