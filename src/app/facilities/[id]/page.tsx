import Link from "next/link";
import FacilityCalendar from "@/components/FacilityCalendar";
import FacilityDetailClient from "@/components/FacilityDetailClient";

export const dynamic = "force-dynamic";

type PageProps = {
  // ✅ Next App Router params는 Promise가 아니라 객체입니다.
  params: { id: string };
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

const featureLabels: Record<string, string> = {
  wifi: "무선인터넷",
  audio: "음향시설",
  lectern: "전자교탁",
  projector: "프로젝터",
  whiteboard: "화이트보드",
  aircon: "에어컨",
};

const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

/**
 * ✅ 상세 조회를 Supabase 직접 호출이 아니라,
 * 이미 배포에서 검증된 내부 API로 통일합니다.
 * - 로컬/배포 환경변수 차이
 * - RLS 차이
 * - service role 사용 여부
 * 이런 문제를 재발시키지 않습니다.
 */
async function getFacility(id: string): Promise<Facility | null> {
  try {
    // 상대경로 fetch는 서버 컴포넌트에서도 정상 동작합니다.
    // cache: "no-store"로 최신 데이터 보장
    const res = await fetch(`/api/facilities/${id}`, { cache: "no-store" });

    if (!res.ok) {
      console.error("[getFacility] API error:", res.status, res.statusText);
      return null;
    }

    const json = await res.json();

    // API 응답 형태가 { ok: true, facility: {...} } 또는
    // { ok: true, data: {...} } 등일 수 있어서 안전 처리
    const facility = (json?.facility ?? json?.data ?? null) as Facility | null;

    if (!facility) return null;

    // 혹시 비활성 시설은 상세에서 제외하고 싶다면 이 체크 유지
    // (API 쪽에서 이미 처리하면 여기서는 필요 없음)
    return facility;
  } catch (err) {
    console.error("[getFacility] Exception:", err);
    return null;
  }
}

export default async function FacilityDetailPage({ params }: PageProps) {
  const { id } = params;

  const facility = await getFacility(id);

  if (!facility) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>시설을 찾을 수 없습니다</h1>
        <Link href="/" style={{ color: "var(--color-primary, #3b82f6)" }}>
          ← 홈으로 돌아가기
        </Link>
      </div>
    );
  }

  const openFeatures = facility.features
    ? Object.keys(facility.features).filter((k) => facility.features?.[k])
    : [];

  const closedDayNames = facility.closed_days
    ? facility.closed_days.map((d) => dayNames[d]).join(", ")
    : null;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 24 }}>
      {/* 헤더 */}
      <div style={{ marginBottom: 24 }}>
        <Link
          href="/"
          style={{
            color: "var(--text-muted, #888)",
            textDecoration: "none",
            fontSize: 14,
          }}
        >
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
            <div
              style={{
                width: "100%",
                height: 280,
                background: "var(--card-bg, #1a1a1a)",
                borderRadius: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 48,
                color: "#444",
              }}
            >
              🏢
            </div>
          )}
        </div>

        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>{facility.name}</h1>

          <div style={{ display: "grid", gap: 8, color: "var(--text-muted, #888)", fontSize: 14 }}>
            <div>📍 {facility.location || "위치 미입력"}</div>
            <div>
              👥 수용 인원: {facility.min_people} ~ {facility.max_people}명
            </div>
            {facility.open_time && facility.close_time && (
              <div>
                🕐 운영 시간: {facility.open_time} ~ {facility.close_time}
              </div>
            )}
            {closedDayNames && <div>🚫 휴무일: {closedDayNames}</div>}
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
        <div
          style={{
            background: "var(--card-bg, #1a1a1a)",
            borderRadius: 16,
            padding: 24,
            marginBottom: 32,
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>📋 이용 안내</h2>
          <div style={{ color: "var(--text-muted, #ccc)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
            {facility.usage_guide}
          </div>
        </div>
      )}

      {/* 캘린더 */}
      <div
        style={{
          background: "var(--card-bg, #1a1a1a)",
          borderRadius: 16,
          padding: 24,
          marginBottom: 32,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>📅 예약하기</h2>
        <FacilityCalendar
          facilityId={facility.id}
          facilityName={facility.name}
          openTime={facility.open_time || "09:00"}
          closeTime={facility.close_time || "22:00"}
          closedDays={facility.closed_days || []}
        />
      </div>

      {/* 클라이언트 컴포넌트 (리뷰, 대기열) */}
      <FacilityDetailClient facilityId={facility.id} facilityName={facility.name} />
    </div>
  );
}
