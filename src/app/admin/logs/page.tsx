"use client";

import { useEffect, useState } from "react";

type Log = {
  id: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, any>;
  created_at: string;
};

const actionLabels: Record<string, { label: string; color: string; icon: string }> = {
  reservation_approve: { label: "예약 승인", color: "#22c55e", icon: "✅" },
  reservation_reject: { label: "예약 거절", color: "#ef4444", icon: "❌" },
  reservation_cancel: { label: "예약 취소", color: "#6b7280", icon: "🚫" },
  facility_create: { label: "시설물 등록", color: "#3b82f6", icon: "🏢" },
  facility_update: { label: "시설물 수정", color: "#eab308", icon: "✏️" },
  facility_delete: { label: "시설물 삭제", color: "#ef4444", icon: "🗑️" },
  notice_create: { label: "공지 등록", color: "#8b5cf6", icon: "📢" },
  notice_update: { label: "공지 수정", color: "#eab308", icon: "✏️" },
  notice_delete: { label: "공지 삭제", color: "#ef4444", icon: "🗑️" },
  holiday_create: { label: "휴일 등록", color: "#06b6d4", icon: "🗓️" },
  holiday_delete: { label: "휴일 삭제", color: "#ef4444", icon: "🗑️" },
  admin_login: { label: "관리자 로그인", color: "#22c55e", icon: "🔐" },
  admin_logout: { label: "관리자 로그아웃", color: "#6b7280", icon: "🚪" },
  password_change: { label: "비밀번호 변경", color: "#eab308", icon: "🔑" },
};

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const fetchLogs = async () => {
    try {
      const url = filter === "all" 
        ? "/api/admin/logs?limit=100" 
        : `/api/admin/logs?limit=100&action=${filter}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.ok) {
        setLogs(json.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActionInfo = (action: string) => {
    return actionLabels[action] || { label: action, color: "var(--text-muted, #888)", icon: "📝" };
  };

  const formatDetails = (details: Record<string, any>) => {
    if (!details || Object.keys(details).length === 0) return null;
    
    const items = [];
    if (details.facility_name) items.push(`시설: ${details.facility_name}`);
    if (details.applicant_name) items.push(`신청자: ${details.applicant_name}`);
    if (details.name) items.push(`이름: ${details.name}`);
    if (details.date) items.push(`날짜: ${details.date}`);
    if (details.reason) items.push(`사유: ${details.reason}`);
    
    return items.length > 0 ? items.join(" / ") : JSON.stringify(details);
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>활동 로그</h1>
          <p style={{ color: "var(--text-muted, #888)", fontSize: 14, marginTop: 4 }}>
            관리자 활동 이력을 조회합니다.
          </p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            border: "1px solid var(--border-color, #333)",
            background: "var(--card-bg, #1a1a1a)",
            color: "white",
            fontSize: 14,
          }}
        >
          <option value="all">전체</option>
          <option value="reservation_approve">예약 승인</option>
          <option value="reservation_reject">예약 거절</option>
          <option value="facility_create">시설물 등록</option>
          <option value="notice_create">공지 등록</option>
          <option value="admin_login">로그인</option>
        </select>
      </div>

      {loading ? (
        <div style={{ color: "var(--text-muted, #888)", padding: 40, textAlign: "center" }}>로딩 중...</div>
      ) : logs.length === 0 ? (
        <div style={{
          padding: 40,
          background: "var(--card-bg, #1a1a1a)",
          borderRadius: 12,
          textAlign: "center",
          color: "var(--text-muted, #888)",
        }}>
          기록된 활동 로그가 없습니다.
        </div>
      ) : (
        <div style={{ background: "var(--card-bg, #1a1a1a)", borderRadius: 12, overflow: "hidden" }}>
          {logs.map((log, idx) => {
            const actionInfo = getActionInfo(log.action);
            return (
              <div
                key={log.id}
                style={{
                  padding: "14px 20px",
                  borderBottom: idx < logs.length - 1 ? "1px solid var(--border-color, #222)" : "none",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 20 }}>{actionInfo.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: 999,
                        fontSize: 12,
                        background: actionInfo.color + "22",
                        color: actionInfo.color,
                      }}
                    >
                      {actionInfo.label}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--text-subtle, #666)" }}>
                      {formatDate(log.created_at)}
                    </span>
                  </div>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <div style={{ fontSize: 13, color: "var(--text-muted, #888)", marginTop: 6 }}>
                      {formatDetails(log.details)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
