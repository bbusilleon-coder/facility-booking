"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type MenuItem = {
  href: string;
  label: string;
  exact?: boolean;
  superOnly?: boolean; // 슈퍼관리자만 접근 가능
};

const menuItems: MenuItem[] = [
  { href: "/admin", label: "📊 대시보드", exact: true },
  { href: "/admin/reservations", label: "📅 예약 관리" },
  { href: "/admin/statistics", label: "💰 대관수입 통계" },
  { href: "/admin/facilities", label: "🏢 시설물 관리", superOnly: true },
  { href: "/admin/members", label: "👤 회원 관리" },
  { href: "/admin/waitlist", label: "⏰ 대기열 관리" },
  { href: "/admin/reviews", label: "⭐ 리뷰 관리" },
  { href: "/admin/notices", label: "📢 공지사항" },
  { href: "/admin/holidays", label: "🗓️ 휴일 관리" },
  { href: "/admin/logs", label: "📋 활동 로그" },
  { href: "/admin/users", label: "👥 관리자 계정", superOnly: true },
  { href: "/admin/settings", label: "⚙️ 설정", superOnly: true },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);
  const [adminName, setAdminName] = useState<string>("");
  const [adminRole, setAdminRole] = useState<string>(""); // 빈 문자열로 시작
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // 인증 체크
  useEffect(() => {
    // 로그인 페이지면 체크 안함
    if (pathname === "/admin/login") {
      setIsAuthed(true);
      return;
    }

    const checkAuth = async () => {
      const token = localStorage.getItem("adminToken");
      const expiresAt = localStorage.getItem("adminExpiresAt");
      
      // localStorage에서 role 먼저 읽기
      const storedRole = localStorage.getItem("adminRole") || "";
      setAdminRole(storedRole);

      // 토큰이 없으면 로그인 필요
      if (!token) {
        setIsAuthed(false);
        return;
      }

      // 만료 시간 체크 (로컬에서 먼저)
      if (expiresAt) {
        const expiry = new Date(expiresAt);
        if (expiry < new Date()) {
          // 만료됨
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminExpiresAt");
          localStorage.removeItem("adminName");
          localStorage.removeItem("adminRole");
          setIsAuthed(false);
          return;
        }
      }

      // 서버에서 세션 확인
      try {
        const res = await fetch("/api/admin/auth", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        
        if (json.ok) {
          setIsAuthed(true);
          setAdminName(localStorage.getItem("adminName") || "관리자");
          setAdminRole(localStorage.getItem("adminRole") || "admin");
        } else {
          // 서버에서 세션 무효 - 하지만 로컬 만료 전이면 유지
          if (expiresAt && new Date(expiresAt) > new Date()) {
            setIsAuthed(true);
            setAdminName(localStorage.getItem("adminName") || "관리자");
            setAdminRole(localStorage.getItem("adminRole") || "admin");
          } else {
            setIsAuthed(false);
            localStorage.removeItem("adminToken");
            localStorage.removeItem("adminExpiresAt");
          }
        }
      } catch (err) {
        // 네트워크 오류시 로컬 토큰 기준으로 유지
        if (expiresAt && new Date(expiresAt) > new Date()) {
          setIsAuthed(true);
          setAdminName(localStorage.getItem("adminName") || "관리자");
          setAdminRole(localStorage.getItem("adminRole") || "admin");
        } else {
          setIsAuthed(false);
        }
      }
    };

    checkAuth();
  }, [pathname]);

  // 미인증 시 리다이렉트 (별도 useEffect로 분리)
  useEffect(() => {
    if (isAuthed === false && pathname !== "/admin/login") {
      router.push("/admin/login");
    }
  }, [isAuthed, pathname, router]);

  // 권한 체크: 일반 관리자가 슈퍼관리자 전용 페이지 접근 시 리다이렉트
  useEffect(() => {
    // role이 아직 로드되지 않았으면 체크하지 않음
    if (!adminRole) return;
    
    const isSuperAdmin = adminRole === "super" || adminRole === "super_admin";
    if (isAuthed && !isSuperAdmin && pathname !== "/admin/login") {
      const restrictedPaths = ["/admin/facilities", "/admin/users", "/admin/settings"];
      const isRestricted = restrictedPaths.some(
        (p) => pathname === p || pathname.startsWith(p + "/")
      );
      if (isRestricted) {
        alert("접근 권한이 없습니다. 슈퍼관리자만 접근할 수 있습니다.");
        router.push("/admin");
      }
    }
  }, [isAuthed, adminRole, pathname, router]);

  // 슈퍼관리자 여부 확인 (role이 비어있으면 일단 슈퍼관리자로 간주하여 메뉴 표시)
  const isSuperAdmin = !adminRole || adminRole === "super" || adminRole === "super_admin";

  // 권한에 따라 메뉴 필터링
  const filteredMenuItems = menuItems.filter((item) => {
    if (item.superOnly && !isSuperAdmin) {
      return false;
    }
    return true;
  });

  const handleLogout = async () => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      try {
        await fetch("/api/admin/auth", {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {}
    }
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminExpiresAt");
    localStorage.removeItem("adminName");
    localStorage.removeItem("adminRole");
    router.push("/admin/login");
  };

  // 로그인 페이지
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // 로딩 중 또는 미인증 (리다이렉트 대기)
  if (isAuthed === null || isAuthed === false) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--background, #0a0a0a)" }}>
        <div style={{ color: "var(--text-muted, #888)" }}>로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="admin-shell" style={{ display: "flex", minHeight: "100vh", background: "var(--background, #0a0a0a)" }}>
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
          {filteredMenuItems.map((item) => {
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
            <div style={{ fontSize: 13, color: "var(--text-muted, #888)", marginBottom: 4 }}>
              👤 {adminName}
            </div>
            <div style={{ fontSize: 11, color: (adminRole === "super" || adminRole === "super_admin") ? "#22c55e" : "#888", marginBottom: 8 }}>
              {(adminRole === "super" || adminRole === "super_admin") ? "🔑 슈퍼관리자" : adminRole ? "👔 관리자" : ""}
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
      <main className="admin-main" style={{ flex: 1, overflow: "auto" }}>
        {children}
      </main>
    </div>
  );
}
