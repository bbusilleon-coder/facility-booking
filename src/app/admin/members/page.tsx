"use client";

import { useEffect, useState } from "react";

type Member = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  department: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
};

export default function AdminMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    department: "",
    is_active: true,
  });

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      
      const res = await fetch(`/api/admin/members?${params}`);
      const json = await res.json();
      if (json.ok) {
        setMembers(json.members || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleSearch = () => {
    fetchMembers();
  };

  const openAddModal = () => {
    setEditing(null);
    setForm({
      email: "",
      password: "",
      name: "",
      phone: "",
      department: "",
      is_active: true,
    });
    setError(null);
    setShowModal(true);
  };

  const openEditModal = (member: Member) => {
    setEditing(member);
    setForm({
      email: member.email,
      password: "",
      name: member.name,
      phone: member.phone || "",
      department: member.department || "",
      is_active: member.is_active,
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
        // 수정
        const res = await fetch(`/api/admin/members/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.message);
        alert("회원 정보가 수정되었습니다.");
      } else {
        // 등록
        if (!form.password) throw new Error("비밀번호를 입력해주세요.");
        const res = await fetch("/api/admin/members", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.message);
        alert("회원이 등록되었습니다.");
      }
      setShowModal(false);
      fetchMembers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (member: Member) => {
    if (!confirm(`"${member.name}" 회원을 삭제하시겠습니까?\n\n⚠️ 이 회원의 예약 기록도 함께 삭제될 수 있습니다.`)) return;
    
    try {
      const res = await fetch(`/api/admin/members/${member.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.ok) {
        alert(json.message);
        return;
      }
      alert("회원이 삭제되었습니다.");
      fetchMembers();
    } catch (err) {
      console.error(err);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const handleToggleActive = async (member: Member) => {
    const newStatus = !member.is_active;
    const action = newStatus ? "활성화" : "비활성화";
    
    if (!confirm(`"${member.name}" 회원을 ${action}하시겠습니까?`)) return;

    try {
      const res = await fetch(`/api/admin/members/${member.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: newStatus }),
      });
      const json = await res.json();
      if (!json.ok) {
        alert(json.message);
        return;
      }
      fetchMembers();
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return "-";
    return new Date(d).toLocaleString("ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPhone = (phone: string | null) => {
    if (!phone) return "-";
    if (phone.length === 11) {
      return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
    }
    return phone;
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>회원 관리</h1>
          <p style={{ color: "#888", fontSize: 14, marginTop: 4 }}>등록된 회원을 관리합니다.</p>
        </div>
        <button
          onClick={openAddModal}
          style={{
            padding: "10px 20px",
            borderRadius: 10,
            background: "#3b82f6",
            color: "white",
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          + 회원 등록
        </button>
      </div>

      {/* 검색 */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="이름, 이메일, 연락처, 소속 검색"
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #333",
            background: "#1a1a1a",
            color: "white",
            width: 280,
          }}
        />
        <button
          onClick={handleSearch}
          style={{
            padding: "10px 20px",
            borderRadius: 8,
            border: "none",
            background: "#3b82f6",
            color: "white",
            cursor: "pointer",
          }}
        >
          검색
        </button>
        <span style={{ color: "#888", fontSize: 14, alignSelf: "center" }}>
          총 {members.length}명
        </span>
      </div>

      {/* 회원 목록 */}
      {loading ? (
        <div style={{ color: "#888", padding: 40, textAlign: "center" }}>로딩 중...</div>
      ) : members.length === 0 ? (
        <div style={{ padding: 40, background: "#1a1a1a", borderRadius: 12, textAlign: "center", color: "#888" }}>
          {search ? "검색 결과가 없습니다." : "등록된 회원이 없습니다."}
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
            <thead>
              <tr style={{ background: "#1a1a1a", borderBottom: "1px solid #333" }}>
                <th style={thStyle}>이름</th>
                <th style={thStyle}>이메일</th>
                <th style={thStyle}>연락처</th>
                <th style={thStyle}>소속</th>
                <th style={thStyle}>상태</th>
                <th style={thStyle}>최근 로그인</th>
                <th style={thStyle}>가입일</th>
                <th style={thStyle}>관리</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} style={{ borderBottom: "1px solid #222" }}>
                  <td style={tdStyle}>
                    <span style={{ fontWeight: 600 }}>{m.name}</span>
                  </td>
                  <td style={tdStyle}>{m.email}</td>
                  <td style={tdStyle}>{formatPhone(m.phone)}</td>
                  <td style={tdStyle}>{m.department || "-"}</td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: 999,
                        fontSize: 12,
                        background: m.is_active ? "#22c55e22" : "#6b728022",
                        color: m.is_active ? "#22c55e" : "#6b7280",
                        cursor: "pointer",
                      }}
                      onClick={() => handleToggleActive(m)}
                      title="클릭하여 상태 변경"
                    >
                      {m.is_active ? "활성" : "비활성"}
                    </span>
                  </td>
                  <td style={tdStyle}>{formatDate(m.last_login_at)}</td>
                  <td style={tdStyle}>{formatDate(m.created_at)}</td>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => openEditModal(m)}
                        style={btnStyle}
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(m)}
                        style={{ ...btnStyle, borderColor: "#ef4444", color: "#ef4444" }}
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 모달 */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: "#1a1a1a",
              borderRadius: 16,
              padding: 24,
              width: "100%",
              maxWidth: 450,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>
              {editing ? "회원 정보 수정" : "회원 등록"}
            </h2>

            {error && (
              <div
                style={{
                  background: "#3a1a1a",
                  border: "1px solid #f44",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 16,
                  color: "#faa",
                  fontSize: 14,
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>이메일 *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={!!editing}
                  required
                  style={{ ...inputStyle, opacity: editing ? 0.5 : 1 }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>
                  비밀번호 {editing ? "(변경 시에만 입력)" : "*"}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={editing ? "변경하려면 입력" : ""}
                  required={!editing}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>이름 *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>연락처</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="01012345678"
                    style={inputStyle}
                  />
                </div>
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

              {editing && (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14 }}>
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    />
                    계정 활성화
                  </label>
                </div>
              )}

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 10,
                    border: "1px solid #444",
                    background: "transparent",
                    color: "#aaa",
                    cursor: "pointer",
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    flex: 1,
                    padding: 12,
                    borderRadius: 10,
                    border: "none",
                    background: saving ? "#444" : "#3b82f6",
                    color: "white",
                    cursor: saving ? "not-allowed" : "pointer",
                    fontWeight: 600,
                  }}
                >
                  {saving ? "저장 중..." : "저장"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: "12px 16px",
  textAlign: "left",
  fontSize: 13,
  fontWeight: 600,
  color: "#888",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 16px",
  fontSize: 14,
};

const btnStyle: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 6,
  border: "1px solid #444",
  background: "transparent",
  color: "#aaa",
  cursor: "pointer",
  fontSize: 12,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 6,
  fontSize: 14,
  color: "#aaa",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #333",
  background: "#0f0f0f",
  color: "white",
  fontSize: 14,
};
