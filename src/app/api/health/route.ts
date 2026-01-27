import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "health ok",
    time: new Date().toISOString(),
  });
}
