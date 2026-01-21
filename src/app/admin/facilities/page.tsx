import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import FacilityDeleteButton from "./FacilityDeleteButton";

type Facility = {
  id: string;
  name: string;
  location: string | null;
  image_url: string | null;
  min_people: number;
  max_people: number;
  is_active: boolean;
  open_time: string | null;
  close_time: string | null;
  created_at: string;
};

async function getFacilities(): Promise<Facility[]> {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from("facilities")
    .select("id, name, location, image_url, min_people, max_people, is_active, open_time, close_time, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch facilities:", error);
    return [];
  }

  return data || [];
}

export default async function AdminFacilitiesPage() {
  const facilities = await getFacilities();

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>시설물 관리</h1>
          <p style={{ color: "#888", fontSize: 14, marginTop: 4 }}>
            총 {facilities.length}개의 시설물
          </p>
        </div>
        <Link
          href="/admin/facilities/new"
          style={{
            padding: "10px 20px",
            borderRadius: 10,
            background: "#3b82f6",
            color: "white",
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          + 시설물 등록
        </Link>
      </div>

      {facilities.length === 0 ? (
        <div style={{
          padding: 40,
          background: "#1a1a1a",
          borderRadius: 12,
          textAlign: "center",
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🏢</div>
          <div style={{ color: "#888", marginBottom: 16 }}>등록된 시설물이 없습니다.</div>
          <Link
            href="/admin/facilities/new"
            style={{
              display: "inline-block",
              padding: "10px 20px",
              borderRadius: 10,
              background: "#3b82f6",
              color: "white",
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            첫 시설물 등록하기
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {facilities.map((f) => (
            <div
              key={f.id}
              style={{
                background: "#1a1a1a",
                borderRadius: 12,
                overflow: "hidden",
                border: "1px solid #222",
              }}
            >
              {/* 이미지 */}
              {f.image_url ? (
                <img
                  src={f.image_url}
                  alt={f.name}
                  style={{
                    width: "100%",
                    height: 120,
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div style={{
                  width: "100%",
                  height: 120,
                  background: "#111",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#444",
                  fontSize: 32,
                }}>
                  🏢
                </div>
              )}

              <div style={{ padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{f.name}</div>
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: 999,
                      fontSize: 11,
                      background: f.is_active ? "#22c55e22" : "#6b728022",
                      color: f.is_active ? "#22c55e" : "#6b7280",
                    }}
                  >
                    {f.is_active ? "활성" : "비활성"}
                  </span>
                </div>

                <div style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>
                  <div>📍 {f.location || "위치 미입력"}</div>
                  <div>👥 {f.min_people}~{f.max_people}명</div>
                  <div>⏰ {f.open_time || "09:00"} ~ {f.close_time || "22:00"}</div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <Link
                    href={`/admin/facilities/${f.id}`}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #444",
                      color: "#aaa",
                      textDecoration: "none",
                      fontSize: 13,
                      textAlign: "center",
                    }}
                  >
                    수정
                  </Link>
                  <Link
                    href={`/facilities/${f.id}`}
                    target="_blank"
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #3b82f6",
                      color: "#3b82f6",
                      textDecoration: "none",
                      fontSize: 13,
                      textAlign: "center",
                    }}
                  >
                    예약페이지
                  </Link>
                  <FacilityDeleteButton facilityId={f.id} facilityName={f.name} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
