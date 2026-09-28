"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Facility = { id: string; name: string; location: string | null; description: string | null; image_url: string | null; min_people: number; max_people: number; features: Record<string, boolean> | null; is_active: boolean; };
const featureLabels: Record<string, string> = { wifi: "무선인터넷", audio: "음향시설", lectern: "전자교탁", projector: "프로젝터", whiteboard: "화이트보드", aircon: "에어컨" };

export default function HomeClient({ facilities }: { facilities: Facility[] }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = localStorage.getItem("facilityFavorites");
      if (saved) { try { setFavorites(JSON.parse(saved)); } catch { localStorage.removeItem("facilityFavorites"); } }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const toggleFavorite = (id: string) => {
    const next = favorites.includes(id) ? favorites.filter((f) => f !== id) : [...favorites, id];
    setFavorites(next); localStorage.setItem("facilityFavorites", JSON.stringify(next));
  };

  const displayed = (showFavoritesOnly ? facilities.filter((f) => favorites.includes(f.id)) : facilities)
    .slice().sort((a, b) => Number(!favorites.includes(a.id)) - Number(!favorites.includes(b.id)));

  return <section className="ky-facility-section" id="facilities"><div className="ky-shell">
    <div className="ky-section-heading ky-facility-heading"><div><p className="ky-eyebrow ky-dark">FACILITIES</p><h2>시설물 목록</h2><p>목적과 인원에 맞는 공간을 선택해 주세요.</p></div>
      <div className="ky-filter-tabs" role="group" aria-label="시설 목록 필터"><button type="button" className={!showFavoritesOnly ? "active" : ""} onClick={() => setShowFavoritesOnly(false)}>전체 <b>{facilities.length}</b></button><button type="button" className={showFavoritesOnly ? "active" : ""} onClick={() => setShowFavoritesOnly(true)}>관심 시설 <b>{favorites.length}</b></button></div>
    </div>
    {displayed.length === 0 ? <div className="ky-empty-favorites"><strong>{showFavoritesOnly ? "관심 시설이 없습니다." : "등록된 시설물이 없습니다."}</strong><p>{showFavoritesOnly ? "시설 카드의 별표를 눌러 자주 쓰는 강의실을 모아보세요." : "관리자에게 시설 등록을 요청해 주세요."}</p></div> : <div className="ky-facility-grid">
      {displayed.map((f) => { const isFavorite = favorites.includes(f.id); const onKeys = Object.keys(f.features || {}).filter((key) => f.features?.[key]); const floor = f.location?.match(/(\d+)층/)?.[1]; const size = f.max_people >= 50 ? "LARGE" : f.max_people >= 25 ? "MEDIUM" : "SMALL"; return <article className="ky-facility-card" key={f.id}>
        {f.image_url ? <img className="ky-room-image" src={f.image_url} alt={`${f.name} 내부`} /> : <div className="ky-room-placeholder"><span>{f.name.match(/\d+/)?.[0] || "KY"}</span><small>LECTURE ROOM</small></div>}
        <button type="button" className={`ky-favorite${isFavorite ? " active" : ""}`} onClick={() => toggleFavorite(f.id)} aria-label={`${f.name} ${isFavorite ? "관심 시설 해제" : "관심 시설 추가"}`} aria-pressed={isFavorite}>{isFavorite ? "★" : "☆"}</button>
        <div className="ky-card-body"><span className="ky-floor">{floor ? `${floor}F` : "FACILITY"} · {size}</span><h3>{f.name}</h3><p>{f.location || "위치 미입력"} <span>·</span> {f.min_people}–{f.max_people}명</p>
          {f.description && <p className="ky-card-description">{f.description}</p>}
          {onKeys.length > 0 && <ul>{onKeys.slice(0, 3).map((key) => <li key={key}>{featureLabels[key] ?? key}</li>)}{onKeys.length > 3 && <li>＋{onKeys.length - 3}</li>}</ul>}
          <Link className="ky-reserve-button" href={`/facilities/${f.id}`} prefetch={false}>예약하기 <span>→</span></Link>
        </div>
      </article>; })}
    </div>}
  </div></section>;
}
