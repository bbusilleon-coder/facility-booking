import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "facilities";

    if (!file) {
      return NextResponse.json(
        { ok: false, message: "파일이 없습니다." },
        { status: 400 }
      );
    }

    // 파일 크기 체크 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { ok: false, message: "파일 크기는 5MB 이하여야 합니다." },
        { status: 400 }
      );
    }

    // 이미지 타입 체크
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { ok: false, message: "JPG, PNG, GIF, WEBP 파일만 업로드 가능합니다." },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // 고유 파일명 생성
    const ext = file.name.split(".").pop();
    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

    // 파일을 ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Supabase Storage에 업로드
    const { data, error } = await supabase.storage
      .from("facility-images")
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      throw new Error(error.message);
    }

    // 공개 URL 가져오기
    const { data: urlData } = supabase.storage
      .from("facility-images")
      .getPublicUrl(filename);

    return NextResponse.json({
      ok: true,
      url: urlData.publicUrl,
      path: data.path,
    });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}
