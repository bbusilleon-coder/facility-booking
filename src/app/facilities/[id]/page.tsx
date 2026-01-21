import Link from "next/link";
import FacilityCalendar from "@/components/FacilityCalendar";
import FacilityDetailClient from "@/components/FacilityDetailClient";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type PageProps = {
  params: Promise<{ id: string }>;
};

type Facility = {
  id: string;
  name: string;
  location: string | null;
  description: string | null;
  image_url: string | null;
  min_people: number;
  max_people: number;
  features: Record<string, boolean> | null;
  open_time: string | null;
  close_time: string | null;
  closed_days: number[] | null;
  usage_guide: string | null;
};

async function getFacility(id: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, anonKey);

  const { data, error } = await supabase
    .from("facilities")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as Facility;
}

const featureLabels: Record<string, string> = {
  wifi: "무선인터넷",
  audio: "음향시설",
  lectern: "전자교탁",
  projector: "프로젝터",
  whiteboard: "화이트보드",
  aircon: "에어컨",
};

const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

export default async function FacilityDetailPage({ params }: PageProps) {
  const { id } = await params;
  const facility = await getFacility(id);

  if (!facility) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>시설을 찾을 수 없습니다</h1>
        <Link href="/" style={{ color: "var(--color-primary, #3b82f6)" }}>← 홈으로 돌아가기</Link>
      </div>
    );
  }

  const openFeatures = facility.features
    ? Object.keys(facility.features).filter((k) => facility.features![k])
    : [];

  const closedDayNames = facility.closed_days
    ? facility.closed_days.map((d) => dayNames[d]).join(", ")
    : null;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
      {/* 헤더 */}
      <div style={{ marginBottom: 24 }}>
        <Link href="/" style={{ color: "var(--text-muted, #888)", textDecoration: "none", fontSize: 14 }}>
          ← 시설 목록으로
        </Link>
      </div>

      {/* 시설 정보 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 32 }}>
        <div>
          {facility.image_url ? (
            <img
              src={facility.image_url}
              alt={facility.name}
              style={{ width: "100%", height: 280, objectFit: "cover", borderRadius: 16 }}
            />
          ) : (
            <div style={{
              width: "100%",
              height: 280,
              background: "var(--card-bg, #1a1a1a)",
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
              color: "#444",
            }}>
              🏢
            </div>
          )}
        </div>

        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>{facility.name}</h1>
          
          <div style={{ display: "grid", gap: 8, color: "var(--text-muted, #888)", fontSize: 14 }}>
            <div>📍 {facility.location || "위치 미입력"}</div>
            <div>👥 수용 인원: {facility.min_people} ~ {facility.max_people}명</div>
            {facility.open_time && facility.close_time && (
              <div>🕐 운영 시간: {facility.open_time} ~ {facility.close_time}</div>
            )}
            {closedDayNames && (
              <div>🚫 휴무일: {closedDayNames}</div>
            )}
          </div>

          {facility.description && (
            <p style={{ marginTop: 16, color: "var(--text-muted, #ccc)", lineHeight: 1.6 }}>
              {facility.description}
            </p>
          )}

          {/* 편의시설 */}
          {openFeatures.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>편의시설</h3>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {openFeatures.map((key) => (
                  <span
                    key={key}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 999,
                      background: "var(--color-primary-light, #3b82f622)",
                      color: "var(--color-primary, #3b82f6)",
                      fontSize: 13,
                    }}
                  >
                    {featureLabels[key] || key}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 이용 안내 */}
      {facility.usage_guide && (
        <div style={{
          background: "var(--card-bg, #1a1a1a)",
          borderRadius: 16,
          padding: 24,
          marginBottom: 32,
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>📋 이용 안내</h2>
          <div style={{ color: "var(--text-muted, #ccc)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
            {facility.usage_guide}
          </div>
        </div>
      )}

      {/* 캘린더 */}
      <div style={{
        background: "var(--card-bg, #1a1a1a)",
        borderRadius: 16,
        padding: 24,
        marginBottom: 32,
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>📅 예약하기</h2>
        <FacilityCalendar facility={facility} />
      </div>

      {/* 클라이언트 컴포넌트 (리뷰, 대기열) */}
      <FacilityDetailClient facilityId={facility.id} facilityName={facility.name} />
    </div>
  );
}
