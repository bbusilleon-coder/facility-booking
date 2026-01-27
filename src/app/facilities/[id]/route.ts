import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient();
  const { id } = params;

  const { data, error } = await supabase
    .from("facilities")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { ok: false, message: error?.message ?? "Not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, facility: data });
}
