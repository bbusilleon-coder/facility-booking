"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const menuItems = [
  { href: "/admin", label: "📊 대시보드", exact: true },
  { href: "/admin/reservations", label: "📅 예약 관리" },
  { href: "/admin/facilities", label: "🏢 시설물 관리" },
  { href: "/admin/waitlist", label: "⏰ 대기열 관리" },
  { href: "/admin/reviews", label: "⭐ 리뷰 관리" },
  { href: "/admin/notices", label: "📢 공지사항" },
  { href: "/admin/holidays", label: "🗓️ 휴일 관리" },
  { href: "/admin/logs", label: "📋 활동 로그" },
  { href: "/admin/users", label: "👥 관리자 계정" },
  { href: "/admin/settings", label: "⚙️ 설정" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const [adminName, setAdminName] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        setIsAuthed(false);
        return;
      }

      try {
        const res = await fetch("/api/admin/auth", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.ok) {
          setIsAuthed(true);
          setAdminName(localStorage.getItem("adminName") || "관리자");
        } else {
          setIsAuthed(false);
          localStorage.removeItem("adminToken");
        }
      } catch {
        setIsAuthed(false);
      }
    };

    if (pathname !== "/admin/login") {
      checkAuth();
    } else {
      setIsAuthed(true);
    }
  }, [pathname]);

  const handleLogout = async () => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      await fetch("/api/admin/auth", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminName");
    localStorage.removeItem("adminRole");
    router.push("/admin/login");
  };

  if (isAuthed === null) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--background, #0a0a0a)" }}>
        <div style={{ color: "var(--text-muted, #888)" }}>로딩 중...</div>
      </div>
    );
  }

  if (isAuthed === false && pathname !== "/admin/login") {
    router.push("/admin/login");
    return null;
  }

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--background, #0a0a0a)" }}>
      {/* 사이드바 */}
      <aside
        style={{
          width: sidebarOpen ? 240 : 60,
          background: "var(--card-bg, #111)",
          borderRight: "1px solid var(--border-color, #222)",
          padding: sidebarOpen ? "20px 12px" : "20px 8px",
          display: "flex",
          flexDirection: "column",
          transition: "width 0.2s",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          {sidebarOpen && (
            <Link href="/" style={{ fontSize: 18, fontWeight: 800, color: "var(--foreground, white)", textDecoration: "none" }}>
              🏢 시설예약
            </Link>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted, #888)",
              cursor: "pointer",
              fontSize: 18,
              padding: 4,
            }}
          >
            {sidebarOpen ? "◀" : "▶"}
          </button>
        </div>

        <nav style={{ flex: 1 }}>
          {menuItems.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: sidebarOpen ? "10px 12px" : "10px 8px",
                  marginBottom: 4,
                  borderRadius: 8,
                  textDecoration: "none",
                  fontSize: 14,
                  color: isActive ? "var(--color-primary, #3b82f6)" : "var(--text-muted, #888)",
                  background: isActive ? "var(--color-primary-light, #3b82f622)" : "transparent",
                  whiteSpace: "nowrap",
                  justifyContent: sidebarOpen ? "flex-start" : "center",
                }}
                title={!sidebarOpen ? item.label : undefined}
              >
                <span>{item.label.split(" ")[0]}</span>
                {sidebarOpen && <span>{item.label.split(" ").slice(1).join(" ")}</span>}
              </Link>
            );
          })}
        </nav>

        {/* 사용자 정보 */}
        {sidebarOpen && (
          <div style={{ borderTop: "1px solid var(--border-color, #222)", paddingTop: 16 }}>
            <div style={{ fontSize: 13, color: "var(--text-muted, #888)", marginBottom: 8 }}>
              👤 {adminName}
            </div>
            <button
              onClick={handleLogout}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid var(--border-color, #333)",
                background: "transparent",
                color: "var(--text-muted, #888)",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              로그아웃
            </button>
          </div>
        )}
      </aside>

      {/* 메인 콘텐츠 */}
      <main style={{ flex: 1, overflow: "auto" }}>
        {children}
      </main>
    </div>
  );
}
