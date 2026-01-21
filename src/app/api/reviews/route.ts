import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// GET: 리뷰 목록 조회
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const facilityId = searchParams.get("facilityId");
    const limit = parseInt(searchParams.get("limit") || "10");

    const supabase = createServerClient();

    let query = supabase
      .from("reviews")
      .select(`
        *,
        facility:facilities(id, name)
      `)
      .eq("is_visible", true)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (facilityId) {
      query = query.eq("facility_id", facilityId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // 평균 별점 계산
    let avgRating = 0;
    if (data && data.length > 0) {
      const total = data.reduce((sum, r) => sum + r.rating, 0);
      avgRating = Math.round((total / data.length) * 10) / 10;
    }

    return NextResponse.json({
      ok: true,
      reviews: data || [],
      avgRating,
      totalCount: data?.length || 0,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}

// POST: 리뷰 작성
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = createServerClient();

    // 예약 확인 (완료된 예약만 리뷰 가능)
    const { data: reservation } = await supabase
      .from("reservations")
      .select("id, facility_id, end_at")
      .eq("id", body.reservation_id)
      .eq("status", "approved")
      .single();

    if (!reservation) {
      return NextResponse.json(
        { ok: false, message: "유효하지 않은 예약입니다." },
        { status: 400 }
      );
    }

    // 예약 시간이 지났는지 확인
    if (new Date(reservation.end_at) > new Date()) {
      return NextResponse.json(
        { ok: false, message: "이용 완료 후 리뷰를 작성할 수 있습니다." },
        { status: 400 }
      );
    }

    // 이미 리뷰를 작성했는지 확인
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("reservation_id", body.reservation_id)
      .single();

    if (existingReview) {
      return NextResponse.json(
        { ok: false, message: "이미 리뷰를 작성하셨습니다." },
        { status: 400 }
      );
    }

    // 리뷰 작성
    const { data, error } = await supabase
      .from("reviews")
      .insert([{
        facility_id: reservation.facility_id,
        reservation_id: body.reservation_id,
        rating: Math.min(5, Math.max(1, body.rating)),
        content: body.content || "",
        author_name: body.author_name,
        is_visible: true,
      }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      review: data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}

// DELETE: 리뷰 삭제 (관리자)
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { ok: false, message: "리뷰 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { error } = await supabase
      .from("reviews")
      .update({ is_visible: false })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: err.message },
      { status: 500 }
    );
  }
}
