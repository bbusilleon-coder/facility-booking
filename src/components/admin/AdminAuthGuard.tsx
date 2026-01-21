"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

type Props = {
  children: React.ReactNode;
};

export default function AdminAuthGuard({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [sessionInfo, setSessionInfo] = useState<{ expiresAt: string; rememberMe: boolean } | null>(null);

  const validateSession = useCallback(async () => {
    // 로그인 페이지는 체크 제외
    if (pathname === "/admin/login") {
      setIsAuthenticated(true);
      return;
    }

    const token = localStorage.getItem("adminToken");

    if (!token) {
      router.replace("/admin/login");
      return;
    }

    try {
      const res = await fetch("/api/admin/auth", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const json = await res.json();

      if (!json.ok) {
        // 세션 만료
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminExpiresAt");
        localStorage.removeItem("adminRememberMe");
        router.replace("/admin/login");
        return;
      }

      setSessionInfo(json.session);
      setIsAuthenticated(true);
    } catch {
      localStorage.removeItem("adminToken");
      router.replace("/admin/login");
    }
  }, [pathname, router]);

  // 초기 세션 검증
  useEffect(() => {
    validateSession();
  }, [validateSession]);

  // 30분 타임아웃 체크 (자동 로그인이 아닌 경우)
  useEffect(() => {
    if (!isAuthenticated || pathname === "/admin/login") return;

    const rememberMe = localStorage.getItem("adminRememberMe") === "true";
    
    if (rememberMe) return; // 자동 로그인은 타임아웃 없음

    // 1분마다 세션 체크
    const interval = setInterval(() => {
      validateSession();
    }, 60 * 1000);

    // 사용자 활동 감지 시 세션 연장
    const handleActivity = () => {
      validateSession();
    };

    // 클릭, 키보드 입력 시 세션 연장
    window.addEventListener("click", handleActivity);
    window.addEventListener("keydown", handleActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("keydown", handleActivity);
    };
  }, [isAuthenticated, pathname, validateSession]);

  // 남은 시간 표시를 위한 상태 (선택적)
  useEffect(() => {
    if (!sessionInfo || pathname === "/admin/login") return;

    const checkExpiry = () => {
      const expiresAt = new Date(sessionInfo.expiresAt).getTime();
      const now = Date.now();
      const remaining = expiresAt - now;

      // 5분 전 경고
      if (remaining > 0 && remaining <= 5 * 60 * 1000 && !sessionInfo.rememberMe) {
        const mins = Math.ceil(remaining / 60000);
        console.log(`세션이 ${mins}분 후 만료됩니다.`);
      }
    };

    const interval = setInterval(checkExpiry, 60 * 1000);
    return () => clearInterval(interval);
  }, [sessionInfo, pathname]);

  if (isAuthenticated === null) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0a",
        color: "#888",
      }}>
        <div style={{ textAlign: "center" }}>
          <div className="skeleton" style={{ width: 40, height: 40, borderRadius: "50%", margin: "0 auto 12px" }} />
          <div>인증 확인 중...</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
