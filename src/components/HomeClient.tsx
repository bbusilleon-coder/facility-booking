"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Facility = {
  id: string;
  name: string;
  location: string | null;
  description: string | null;
  image_url: string | null;
  min_people: number;
  max_people: number;
  features: Record<string, boolean> | null;
  is_active: boolean;
};

const featureLabels: Record<string, string> = {
  wifi: "무선인터넷",
  audio: "음향시설",
  lectern: "전자교탁",
  projector: "프로젝터",
  whiteboard: "화이트보드",
  aircon: "에어컨",
};

interface HomeClientProps {
  facilities: Facility[];
}

export default function HomeClient({ facilities }: HomeClientProps) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("facilityFavorites");
    if (saved) {
      setFavorites(JSON.parse(saved));
    }
  }, []);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    let newFavorites: string[];
    if (favorites.includes(id)) {
      newFavorites = favorites.filter((f) => f !== id);
    } else {
      newFavorites = [...favorites, id];
    }
    setFavorites(newFavorites);
    localStorage.setItem("facilityFavorites", JSON.stringify(newFavorites));
  };

  const displayedFacilities = showFavoritesOnly
    ? facilities.filter((f) => favorites.includes(f.id))
    : facilities;

  // 즐겨찾기를 먼저 보여주기
  const sortedFacilities = [...displayedFacilities].sort((a, b) => {
    const aFav = favorites.includes(a.id) ? 0 : 1;
    const bFav = favorites.includes(b.id) ? 0 : 1;
    return aFav - bFav;
  });

  return (
    <section style={{ marginTop: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>시설물 목록</h2>
        
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setShowFavoritesOnly(false)}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid var(--border-color, #333)",
              background: !showFavoritesOnly ? "var(--color-primary, #3b82f6)" : "transparent",
              color: !showFavoritesOnly ? "white" : "var(--text-muted, #888)",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            전체 ({facilities.length})
          </button>
          <button
            onClick={() => setShowFavoritesOnly(true)}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid var(--border-color, #333)",
              background: showFavoritesOnly ? "var(--color-primary, #3b82f6)" : "transparent",
              color: showFavoritesOnly ? "white" : "var(--text-muted, #888)",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            ⭐ 즐겨찾기 ({favorites.length})
          </button>
        </div>
      </div>

      {sortedFacilities.length === 0 ? (
        <div style={{
          padding: 40,
          border: "1px solid var(--border-color, #222)",
          borderRadius: 12,
          color: "var(--text-muted, #888)",
          textAlign: "center",
        }}>
          {showFavoritesOnly ? "즐겨찾기한 시설이 없습니다." : "등록된 시설물이 없습니다."}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {sortedFacilities.map((f) => {
            const isFavorite = favorites.includes(f.id);
            
            return (
              <div
                key={f.id}
                style={{
                  border: `1px solid ${isFavorite ? "var(--color-primary, #3b82f6)" : "var(--border-color, #222)"}`,
                  borderRadius: 14,
                  overflow: "hidden",
                  background: "var(--card-bg, #0f0f0f)",
                  position: "relative",
                }}
              >
                {/* 즐겨찾기 버튼 */}
                <button
                  onClick={(e) => toggleFavorite(f.id, e)}
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    border: "none",
                    background: isFavorite ? "#fef3c7" : "rgba(0,0,0,0.5)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    zIndex: 10,
                  }}
                  title={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                >
                  {isFavorite ? "⭐" : "☆"}
                </button>

                {f.image_url ? (
                  <img
                    src={f.image_url}
                    alt={f.name}
                    style={{ width: "100%", height: 140, objectFit: "cover" }}
                  />
                ) : (
                  <div style={{
                    width: "100%",
                    height: 140,
                    background: "var(--card-bg, #1a1a1a)",
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
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{f.name}</div>
                  <div style={{ color: "var(--text-muted, #888)", fontSize: 13 }}>
                    📍 {f.location || "위치 미입력"} · 👥 {f.min_people}~{f.max_people}명
                  </div>
                  
                  <FeatureBadges features={f.features} />

                  <Link
                    href={`/facilities/${f.id}`}
                    style={{
                      display: "block",
                      marginTop: 16,
                      padding: "10px 16px",
                      borderRadius: 10,
                      background: "var(--color-primary, #3b82f6)",
                      color: "white",
                      textDecoration: "none",
                      fontSize: 14,
                      fontWeight: 600,
                      textAlign: "center",
                    }}
                  >
                    예약하기
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function FeatureBadges({ features }: { features: Record<string, boolean> | null }) {
  if (!features) return null;
  const onKeys = Object.keys(features).filter((k) => features[k]);
  if (onKeys.length === 0) return null;

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
      {onKeys.slice(0, 3).map((k) => (
        <span
          key={k}
          style={{
            fontSize: 11,
            padding: "3px 8px",
            borderRadius: 999,
            border: "1px solid var(--border-color, #333)",
            background: "var(--card-bg, #1a1a1a)",
            color: "var(--text-muted, #aaa)",
          }}
        >
          {featureLabels[k] ?? k}
        </span>
      ))}
      {onKeys.length > 3 && (
        <span style={{ fontSize: 11, color: "#666" }}>+{onKeys.length - 3}</span>
      )}
    </div>
  );
}
