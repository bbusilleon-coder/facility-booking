"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAutoLogin = async () => {
      const token = localStorage.getItem("adminToken");
      const expiresAt = localStorage.getItem("adminExpiresAt");

      if (token && expiresAt) {
        const expiry = new Date(expiresAt);
        if (expiry > new Date()) {
          try {
            const res = await fetch("/api/admin/auth", {
              headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            if (json.ok) {
              router.replace("/admin");
              return;
            }
          } catch {}
        }
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminExpiresAt");
      }
      setChecking(false);
    };
    checkAutoLogin();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, rememberMe }),
      });

      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "로그인 실패");

      localStorage.setItem("adminToken", json.token);
      localStorage.setItem("adminExpiresAt", json.expiresAt);
      if (json.admin) {
        localStorage.setItem("adminName", json.admin.name);
        localStorage.setItem("adminRole", json.admin.role);
      }

      router.replace("/admin");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a", color: "#888" }}>
        로그인 확인 중...
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 360, background: "#1a1a1a", borderRadius: 16, padding: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, color: "white" }}>관리자 로그인</h1>
        <p style={{ color: "#888", marginBottom: 24, fontSize: 14 }}>시설물 예약 관리 시스템</p>

        {error && (
          <div style={{ background: "#3a1a1a", border: "1px solid #f44", borderRadius: 8, padding: 12, marginBottom: 16, color: "#faa", fontSize: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "#aaa" }}>아이디</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              required
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #333", background: "#0f0f0f", color: "white", fontSize: 14 }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "#aaa" }}>비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoFocus
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #333", background: "#0f0f0f", color: "white", fontSize: 14 }}
            />
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, cursor: "pointer", fontSize: 14, color: "#aaa" }}>
            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
            자동 로그인 (7일간)
          </label>

          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "14px 16px", borderRadius: 10, border: "none", background: loading ? "#444" : "#3b82f6", color: "white", cursor: loading ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600 }}
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <p style={{ marginTop: 16, fontSize: 12, color: "#666", textAlign: "center" }}>
          기본 계정: admin / 1234
        </p>
      </div>
    </div>
  );
}
