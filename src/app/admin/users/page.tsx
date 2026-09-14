"use client";

import { useEffect, useState } from "react";

type Admin = {
  id: string;
  username: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
};

const roleLabels: Record<string, { label: string; color: string }> = {
  super_admin: { label: "슈퍼관리자", color: "#ef4444" },
  admin: { label: "관리자", color: "#3b82f6" },
  viewer: { label: "뷰어", color: "#22c55e" },
};

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Admin | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    phone: "",
    role: "admin",
    is_active: true,
  });

  const fetchAdmins = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const json = await res.json();
      if (json.ok) {
        setAdmins(json.admins || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const openAddModal = () => {
    setEditing(null);
    setForm({
      username: "",
      password: "",
      name: "",
      email: "",
      phone: "",
      role: "admin",
      is_active: true,
    });
    setError(null);
    setShowModal(true);
  };

  const openEditModal = (admin: Admin) => {
    setEditing(admin);
    setForm({
      username: admin.username,
      password: "",
      name: admin.name,
      email: admin.email || "",
      phone: admin.phone || "",
      role: admin.role,
      is_active: admin.is_active,
    });
    setError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (editing) {
        const res = await fetch(`/api/admin/users/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.message);
      } else {
        if (!form.password) throw new Error("비밀번호를 입력해주세요.");
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.message);
      }
      setShowModal(false);
      fetchAdmins();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (admin: Admin) => {
    if (!confirm(`"${admin.name}" 관리자를 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch(`/api/admin/users/${admin.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.ok) {
        alert(json.message);
        return;
      }
      fetchAdmins();
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return "-";
    return new Date(d).toLocaleString("ko-KR", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>관리자 계정</h1>
          <p style={{ color: "var(--text-muted, #888)", fontSize: 14, marginTop: 4 }}>시스템 관리자를 등록하고 관리합니다.</p>
        </div>
        <button onClick={openAddModal} style={{ padding: "10px 20px", borderRadius: 10, background: "#3b82f6", color: "white", border: "none", cursor: "pointer", fontWeight: 600 }}>
          + 관리자 추가
        </button>
      </div>

      {loading ? (
        <div style={{ color: "var(--text-muted, #888)", padding: 40, textAlign: "center" }}>로딩 중...</div>
      ) : admins.length === 0 ? (
        <div style={{ padding: 40, background: "var(--card-bg, #1a1a1a)", borderRadius: 12, textAlign: "center", color: "var(--text-muted, #888)" }}>
          등록된 관리자가 없습니다.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {admins.map((a) => (
            <div key={a.id} style={{ background: "var(--card-bg, #1a1a1a)", borderRadius: 12, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: a.is_active ? "#3b82f622" : "#33333366", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                  👤
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{a.name}</span>
                    <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, background: (roleLabels[a.role]?.color || "#888") + "22", color: roleLabels[a.role]?.color || "#888" }}>
                      {roleLabels[a.role]?.label || a.role}
                    </span>
                    {!a.is_active && (
                      <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, background: "#6b728022", color: "#6b7280" }}>비활성</span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-muted, #888)", marginTop: 2 }}>
                    @{a.username} · 최근 로그인: {formatDate(a.last_login_at)}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => openEditModal(a)} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid var(--border-strong, #444)", background: "transparent", color: "var(--text-secondary, #aaa)", cursor: "pointer", fontSize: 13 }}>수정</button>
                <button onClick={() => handleDelete(a)} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #ef4444", background: "transparent", color: "#ef4444", cursor: "pointer", fontSize: 13 }}>삭제</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowModal(false)}>
          <div style={{ background: "var(--card-bg, #1a1a1a)", borderRadius: 16, padding: 24, width: "100%", maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>{editing ? "관리자 수정" : "관리자 추가"}</h2>
            
            {error && <div style={{ background: "#3a1a1a", border: "1px solid #f44", borderRadius: 8, padding: 12, marginBottom: 16, color: "#faa", fontSize: 14 }}>{error}</div>}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>아이디 *</label>
                <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} disabled={!!editing} required style={{ ...inputStyle, opacity: editing ? 0.5 : 1 }} />
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>비밀번호 {editing ? "(변경시만)" : "*"}</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editing ? "변경하려면 입력" : ""} required={!editing} style={inputStyle} />
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>이름 *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required style={inputStyle} />
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>권한</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={inputStyle}>
                  <option value="admin">관리자</option>
                  <option value="super_admin">슈퍼관리자</option>
                  <option value="viewer">뷰어 (읽기전용)</option>
                </select>
              </div>
              
              {editing && (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
                    <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                    계정 활성화
                  </label>
                </div>
              )}

              <div style={{ display: "flex", gap: 12 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: 12, borderRadius: 10, border: "1px solid var(--border-strong, #444)", background: "transparent", color: "var(--text-secondary, #aaa)", cursor: "pointer" }}>취소</button>
                <button type="submit" disabled={saving} style={{ flex: 1, padding: 12, borderRadius: 10, border: "none", background: saving ? "#444" : "#3b82f6", color: "white", cursor: saving ? "not-allowed" : "pointer", fontWeight: 600 }}>{saving ? "저장 중..." : "저장"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "block", marginBottom: 6, fontSize: 14, color: "var(--text-secondary, #aaa)" };
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border-color, #333)", background: "var(--input-bg, #0f0f0f)", color: "var(--foreground, white)", fontSize: 14 };
