"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function HeaderAuth() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 사용자 로그인 확인
    const token = localStorage.getItem("userToken");
    const expiresAt = localStorage.getItem("userExpiresAt");
    const userName = localStorage.getItem("userName");
    const userEmail = localStorage.getItem("userEmail");

    if (token && expiresAt && new Date(expiresAt) > new Date()) {
      setUser({ name: userName || "사용자", email: userEmail || "" });
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    // 모든 사용자 정보 삭제
    localStorage.removeItem("userToken");
    localStorage.removeItem("userExpiresAt");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userPhone");
    localStorage.removeItem("userDept");
    setUser(null);
    router.refresh();
  };

  if (loading) {
    return (
      <div style={{ display: "flex", gap: 12 }}>
        <span style={{ padding: "10px 16px", color: "var(--text-muted, #888)" }}>...</span>
      </div>
    );
  }

  if (user) {
    return (
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <Link
          href="/reservation"
          prefetch={false}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "1px solid var(--border-color, #333)",
            color: "var(--text-muted, #ccc)",
            textDecoration: "none",
            fontSize: 14,
          }}
        >
          내 예약 조회
        </Link>
        <Link
          href="/checkin"
          prefetch={false}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "1px solid var(--border-color, #333)",
            color: "var(--text-muted, #ccc)",
            textDecoration: "none",
            fontSize: 14,
          }}
        >
          QR 체크인
        </Link>
        <span style={{ color: "var(--color-primary, #3b82f6)", fontSize: 14, fontWeight: 600 }}>
          👤 {user.name}
        </span>
        <button
          onClick={handleLogout}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "1px solid var(--border-color, #333)",
            background: "transparent",
            color: "var(--text-muted, #888)",
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          로그아웃
        </button>
        <Link
          href="/admin"
          prefetch={false}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            background: "var(--card-bg, #1a1a1a)",
            color: "var(--text-muted, #888)",
            textDecoration: "none",
            fontSize: 14,
          }}
        >
          관리자
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      <Link
        href="/reservation"
        prefetch={false}
        style={{
          padding: "10px 16px",
          borderRadius: 10,
          border: "1px solid var(--border-color, #333)",
          color: "var(--text-muted, #ccc)",
          textDecoration: "none",
          fontSize: 14,
        }}
      >
        내 예약 조회
      </Link>
      <Link
        href="/checkin"
        prefetch={false}
        style={{
          padding: "10px 16px",
          borderRadius: 10,
          border: "1px solid var(--border-color, #333)",
          color: "var(--text-muted, #ccc)",
          textDecoration: "none",
          fontSize: 14,
        }}
      >
        QR 체크인
      </Link>
      <Link
        href="/auth"
        prefetch={false}
        style={{
          padding: "10px 16px",
          borderRadius: 10,
          background: "var(--color-primary, #3b82f6)",
          color: "white",
          textDecoration: "none",
          fontSize: 14,
        }}
      >
        로그인
      </Link>
      <Link
        href="/admin"
        prefetch={false}
        style={{
          padding: "10px 16px",
          borderRadius: 10,
          background: "var(--card-bg, #1a1a1a)",
          color: "var(--text-muted, #888)",
          textDecoration: "none",
          fontSize: 14,
        }}
      >
        관리자
      </Link>
    </div>
  );
}
