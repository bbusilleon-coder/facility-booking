"use client";

import { useState, useEffect } from "react";

const themeColors = {
  blue: { name: "블루", primary: "#3b82f6" },
  green: { name: "그린", primary: "#22c55e" },
  purple: { name: "퍼플", primary: "#8b5cf6" },
  red: { name: "레드", primary: "#ef4444" },
  orange: { name: "오렌지", primary: "#f97316" },
  pink: { name: "핑크", primary: "#ec4899" },
  cyan: { name: "시안", primary: "#06b6d4" },
  amber: { name: "앰버", primary: "#f59e0b" },
  indigo: { name: "인디고", primary: "#6366f1" },
  teal: { name: "틸", primary: "#14b8a6" },
};

type ThemeKey = keyof typeof themeColors;
type ModeKey = "dark" | "light";

export default function AdminSettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  const [selectedTheme, setSelectedTheme] = useState<ThemeKey>("blue");
  const [selectedMode, setSelectedMode] = useState<ModeKey>("dark");
  const [themeLoading, setThemeLoading] = useState(true);
  const [themeSaving, setThemeSaving] = useState(false);

  const [notificationEmail, setNotificationEmail] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // 테마 로드
        const themeRes = await fetch("/api/settings/theme");
        const themeJson = await themeRes.json();
        if (themeJson.ok) {
          if (themeJson.theme) setSelectedTheme(themeJson.theme);
          if (themeJson.mode) setSelectedMode(themeJson.mode);
          
          const colors = themeColors[themeJson.theme as ThemeKey] || themeColors.blue;
          document.documentElement.style.setProperty("--color-primary", colors.primary);
          
          if (themeJson.mode === "light") {
            document.body.classList.add("light-mode");
            document.body.classList.remove("dark-mode");
          } else {
            document.body.classList.add("dark-mode");
            document.body.classList.remove("light-mode");
          }
        }

        // 알림 이메일 로드
        const emailRes = await fetch("/api/settings/notification");
        const emailJson = await emailRes.json();
        if (emailJson.ok && emailJson.email) {
          setNotificationEmail(emailJson.email);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setThemeLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleThemeChange = async (theme: ThemeKey) => {
    setSelectedTheme(theme);
    setThemeSaving(true);
    
    const colors = themeColors[theme];
    document.documentElement.style.setProperty("--color-primary", colors.primary);
    
    try {
      await fetch("/api/settings/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme, mode: selectedMode }),
      });
      setMessage({ type: "success", text: "테마가 변경되었습니다." });
    } catch (err) {
      console.error(err);
    } finally {
      setThemeSaving(false);
      setTimeout(() => setMessage(null), 2000);
    }
  };

  const handleModeChange = async (mode: ModeKey) => {
    setSelectedMode(mode);
    setThemeSaving(true);

    if (mode === "light") {
      document.body.classList.add("light-mode");
      document.body.classList.remove("dark-mode");
    } else {
      document.body.classList.add("dark-mode");
      document.body.classList.remove("light-mode");
    }
    
    try {
      await fetch("/api/settings/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: selectedTheme, mode }),
      });
      setMessage({ type: "success", text: "화면 모드가 변경되었습니다." });
    } catch (err) {
      console.error(err);
    } finally {
      setThemeSaving(false);
      setTimeout(() => setMessage(null), 2000);
    }
  };

  const handleEmailSave = async () => {
    setEmailSaving(true);
    try {
      const res = await fetch("/api/settings/notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: notificationEmail }),
      });
      const json = await res.json();
      if (json.ok) {
        setMessage({ type: "success", text: "알림 이메일이 저장되었습니다." });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEmailSaving(false);
      setTimeout(() => setMessage(null), 2000);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "새 비밀번호가 일치하지 않습니다." });
      return;
    }
    
    if (newPassword.length < 4) {
      setMessage({ type: "error", text: "비밀번호는 최소 4자 이상이어야 합니다." });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const json = await res.json();

      if (!json.ok) {
        throw new Error(json.message);
      }

      setMessage({ type: "success", text: "비밀번호가 변경되었습니다." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>설정</h1>
      <p style={{ color: "var(--text-muted, #888)", marginBottom: 32, fontSize: 14 }}>
        시스템 설정을 관리합니다.
      </p>

      {message && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            marginBottom: 24,
            background: message.type === "success" ? "#1a3a1a" : "#3a1a1a",
            border: `1px solid ${message.type === "success" ? "#22c55e" : "#ef4444"}`,
            color: message.type === "success" ? "#4ade80" : "#fca5a5",
            fontSize: 14,
          }}
        >
          {message.text}
        </div>
      )}

      {/* 화면 모드 */}
      <div style={{ background: "var(--card-bg, #1a1a1a)", borderRadius: 16, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>🌓 화면 모드</h2>
        <p style={{ color: "var(--text-muted, #888)", fontSize: 14, marginBottom: 20 }}>
          라이트/다크 모드를 선택합니다.
        </p>

        <div style={{ display: "flex", gap: 12 }}>
          {(["dark", "light"] as ModeKey[]).map((mode) => (
            <button
              key={mode}
              onClick={() => handleModeChange(mode)}
              disabled={themeSaving}
              style={{
                padding: "16px 32px",
                borderRadius: 12,
                border: selectedMode === mode ? "2px solid var(--color-primary, #3b82f6)" : "2px solid var(--border-color, #333)",
                background: selectedMode === mode ? "var(--color-primary-light, #3b82f622)" : "var(--background, #0f0f0f)",
                cursor: themeSaving ? "not-allowed" : "pointer",
                fontSize: 14,
                fontWeight: selectedMode === mode ? 600 : 400,
                color: selectedMode === mode ? "var(--color-primary, #3b82f6)" : "var(--text-muted, #aaa)",
              }}
            >
              {mode === "dark" ? "🌙 다크 모드" : "☀️ 라이트 모드"}
            </button>
          ))}
        </div>
      </div>

      {/* 테마 색상 */}
      <div style={{ background: "var(--card-bg, #1a1a1a)", borderRadius: 16, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>🎨 테마 색상</h2>
        <p style={{ color: "var(--text-muted, #888)", fontSize: 14, marginBottom: 20 }}>
          시스템의 기본 색상을 선택합니다.
        </p>

        {themeLoading ? (
          <div style={{ color: "var(--text-muted, #888)" }}>로딩 중...</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 12 }}>
            {(Object.keys(themeColors) as ThemeKey[]).map((key) => {
              const color = themeColors[key];
              const isSelected = selectedTheme === key;
              
              return (
                <button
                  key={key}
                  onClick={() => handleThemeChange(key)}
                  disabled={themeSaving}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    border: isSelected ? `2px solid ${color.primary}` : "2px solid var(--border-color, #333)",
                    background: isSelected ? `${color.primary}15` : "var(--background, #0f0f0f)",
                    cursor: themeSaving ? "not-allowed" : "pointer",
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: color.primary,
                      margin: "0 auto 8px",
                      boxShadow: isSelected ? `0 0 12px ${color.primary}66` : "none",
                    }}
                  />
                  <div style={{ fontSize: 13, color: isSelected ? color.primary : "var(--text-muted, #aaa)", fontWeight: isSelected ? 600 : 400 }}>
                    {color.name}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 알림 이메일 설정 */}
      <div style={{ background: "var(--card-bg, #1a1a1a)", borderRadius: 16, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>📧 알림 이메일</h2>
        <p style={{ color: "var(--text-muted, #888)", fontSize: 14, marginBottom: 20 }}>
          새 예약 신청 시 알림을 받을 이메일 주소를 설정합니다.
        </p>

        <div style={{ display: "flex", gap: 12, maxWidth: 500 }}>
          <input
            type="email"
            value={notificationEmail}
            onChange={(e) => setNotificationEmail(e.target.value)}
            placeholder="admin@example.com"
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            onClick={handleEmailSave}
            disabled={emailSaving}
            style={{
              padding: "12px 24px",
              borderRadius: 10,
              border: "none",
              background: emailSaving ? "#444" : "var(--color-primary, #3b82f6)",
              color: "white",
              cursor: emailSaving ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            {emailSaving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>

      {/* 비밀번호 변경 */}
      <div style={{ background: "var(--card-bg, #1a1a1a)", borderRadius: 16, padding: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>🔒 비밀번호 변경</h2>
        <p style={{ color: "var(--text-muted, #888)", fontSize: 14, marginBottom: 20 }}>
          관리자 비밀번호를 변경합니다.
        </p>

        <form onSubmit={handlePasswordChange} style={{ maxWidth: 400 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>현재 비밀번호</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required style={inputStyle} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>새 비밀번호</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={4} style={inputStyle} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>새 비밀번호 확인</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required style={inputStyle} />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px 24px",
              borderRadius: 10,
              border: "none",
              background: loading ? "#444" : "var(--color-primary, #3b82f6)",
              color: "white",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            {loading ? "변경 중..." : "비밀번호 변경"}
          </button>
        </form>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "block", marginBottom: 6, fontSize: 14, color: "var(--text-muted, #aaa)" };
const inputStyle: React.CSSProperties = { width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--border-color, #333)", background: "var(--background, #0f0f0f)", color: "var(--foreground, white)", fontSize: 14 };
