import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createServerClient();

    // 두 쿼리를 병렬 실행
    const [{ data: themeData }, { data: modeData }] = await Promise.all([
      supabase
        .from("admin_settings")
        .select("value")
        .eq("key", "theme")
        .single(),
      supabase
        .from("admin_settings")
        .select("value")
        .eq("key", "theme_mode")
        .single(),
    ]);

    const response = NextResponse.json({
      ok: true,
      theme: themeData?.value || "blue",
      mode: modeData?.value || "dark",
    });

    // 테마 설정은 자주 변하지 않으므로 5분 캐시
    response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    return response;
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
