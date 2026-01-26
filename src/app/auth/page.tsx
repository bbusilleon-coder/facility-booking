"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone: "",
    department: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!isLogin && form.password !== form.confirmPassword) {
        throw new Error("비밀번호가 일치하지 않습니다.");
      }

      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isLogin ? "login" : "register",
          ...form,
        }),
      });

      const json = await res.json();

      if (!json.ok) {
        throw new Error(json.message);
      }

      if (isLogin) {
        // 로그인 성공 - 모든 사용자 정보 저장
        localStorage.setItem("userToken", json.token);
        localStorage.setItem("userExpiresAt", json.expiresAt);
        localStorage.setItem("userName", json.user.name || "");
        localStorage.setItem("userEmail", json.user.email || "");
        localStorage.setItem("userPhone", json.user.phone || "");
        localStorage.setItem("userDept", json.user.department || "");
        router.push("/");
      } else {
        setSuccess("회원가입이 완료되었습니다. 로그인해주세요.");
        setIsLogin(true);
        setForm({ ...form, password: "", confirmPassword: "" });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--background, #0a0a0a)",
      padding: 24,
    }}>
      <div style={{
        width: "100%",
        maxWidth: 400,
        background: "var(--card-bg, #1a1a1a)",
        borderRadius: 16,
        padding: 32,
      }}>
        <Link href="/" style={{ color: "var(--text-muted, #888)", fontSize: 13, textDecoration: "none" }}>
          ← 홈으로 돌아가기
        </Link>

        <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 16, marginBottom: 8 }}>
          {isLogin ? "로그인" : "회원가입"}
        </h1>
        <p style={{ color: "var(--text-muted, #888)", marginBottom: 24, fontSize: 14 }}>
          {isLogin ? "계정에 로그인하세요." : "새 계정을 만드세요."}
        </p>

        {error && (
          <div style={{
            background: "#3a1a1a",
            border: "1px solid #f44",
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            color: "#faa",
            fontSize: 14,
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: "#1a3a1a",
            border: "1px solid #4f4",
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
            color: "#afa",
            fontSize: 14,
          }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>이름 *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>연락처</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="010-0000-0000"
                  style={inputStyle}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>소속/부서</label>
                <input
                  type="text"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>이메일 *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>비밀번호 *</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={4}
              style={inputStyle}
            />
          </div>

          {!isLogin && (
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>비밀번호 확인 *</label>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
                style={inputStyle}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: 10,
              border: "none",
              background: loading ? "#444" : "var(--color-primary, #3b82f6)",
              color: "white",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            {loading ? "처리 중..." : isLogin ? "로그인" : "회원가입"}
          </button>
        </form>

        <div style={{ textAlign: "center", fontSize: 14, color: "var(--text-muted, #888)" }}>
          {isLogin ? "계정이 없으신가요?" : "이미 계정이 있으신가요?"}{" "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setSuccess(null);
            }}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-primary, #3b82f6)",
              cursor: "pointer",
              textDecoration: "underline",
              fontSize: 14,
            }}
          >
            {isLogin ? "회원가입" : "로그인"}
          </button>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 6,
  fontSize: 14,
  color: "var(--text-muted, #aaa)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 8,
  border: "1px solid var(--border-color, #333)",
  background: "var(--background, #0f0f0f)",
  color: "var(--foreground, white)",
  fontSize: 14,
};
