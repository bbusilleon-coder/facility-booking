"use client";

import { useState, useEffect } from "react";

interface FavoriteButtonProps {
  facilityId: string;
  size?: "small" | "medium";
}

export default function FavoriteButton({ facilityId, size = "medium" }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem("facilityFavorites") || "[]");
    setIsFavorite(favorites.includes(facilityId));
  }, [facilityId]);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const favorites = JSON.parse(localStorage.getItem("facilityFavorites") || "[]");
    
    if (isFavorite) {
      const newFavorites = favorites.filter((id: string) => id !== facilityId);
      localStorage.setItem("facilityFavorites", JSON.stringify(newFavorites));
      setIsFavorite(false);
    } else {
      favorites.push(facilityId);
      localStorage.setItem("facilityFavorites", JSON.stringify(favorites));
      setIsFavorite(true);
    }
  };

  const buttonSize = size === "small" ? 28 : 36;
  const iconSize = size === "small" ? 16 : 20;

  return (
    <button
      onClick={toggleFavorite}
      title={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
      style={{
        width: buttonSize,
        height: buttonSize,
        borderRadius: "50%",
        border: "none",
        background: isFavorite ? "#fef3c7" : "#1a1a1a",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 0.2s",
      }}
    >
      <span style={{ fontSize: iconSize }}>
        {isFavorite ? "⭐" : "☆"}
      </span>
    </button>
  );
}

// 즐겨찾기 목록 조회 함수
export function getFavorites(): string[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem("facilityFavorites") || "[]");
}
