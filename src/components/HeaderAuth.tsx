"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function HeaderAuth() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const token = localStorage.getItem("userToken");
      const expiresAt = localStorage.getItem("userExpiresAt");
      const userName = localStorage.getItem("userName");
      const userEmail = localStorage.getItem("userEmail");
      if (token && expiresAt && new Date(expiresAt) > new Date()) setUser({ name: userName || "사용자", email: userEmail || "" });
      setLoading(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const handleLogout = () => {
    ["userToken", "userExpiresAt", "userName", "userEmail", "userPhone", "userDept"].forEach((key) => localStorage.removeItem(key));
    setUser(null);
    router.refresh();
  };

  if (loading) return <div className="ky-auth-links"><span className="ky-auth-loading">확인 중</span></div>;

  return <div className="ky-auth-links">
    <Link href="/reservation" prefetch={false}>내 예약 조회</Link><Link href="/checkin" prefetch={false}>QR 체크인</Link>
    {user ? <><span className="ky-user-name">{user.name}님</span><button type="button" onClick={handleLogout}>로그아웃</button></> : <Link className="ky-auth-accent" href="/auth" prefetch={false}>로그인</Link>}
  </div>;
}
