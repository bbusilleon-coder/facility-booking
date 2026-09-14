"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Notice = {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  is_pinned: boolean;
  created_at: string;
};

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotices = async () => {
    try {
      const res = await fetch("/api/notices");
      const json = await res.json();
      if (json.ok) {
        setNotices(json.notices || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/notices/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.ok) {
        fetchNotices();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ko-KR");
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>공지사항 관리</h1>
        <Link
          href="/admin/notices/new"
          style={{
            padding: "10px 20px",
            borderRadius: 10,
            background: "#3b82f6",
            color: "white",
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          + 공지 등록
        </Link>
      </div>

      {loading ? (
        <div style={{ color: "var(--text-muted, #888)", padding: 40, textAlign: "center" }}>로딩 중...</div>
      ) : notices.length === 0 ? (
        <div style={{
          padding: 40,
          background: "var(--card-bg, #1a1a1a)",
          borderRadius: 12,
          textAlign: "center",
          color: "var(--text-muted, #888)",
        }}>
          등록된 공지사항이 없습니다.
        </div>
      ) : (
        <div style={{ background: "var(--card-bg, #1a1a1a)", borderRadius: 12, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color, #333)" }}>
                <th style={{ textAlign: "left", padding: "12px 16px", color: "var(--text-muted, #888)", fontSize: 13 }}>제목</th>
                <th style={{ textAlign: "center", padding: "12px 16px", color: "var(--text-muted, #888)", fontSize: 13, width: 80 }}>상태</th>
                <th style={{ textAlign: "center", padding: "12px 16px", color: "var(--text-muted, #888)", fontSize: 13, width: 80 }}>고정</th>
                <th style={{ textAlign: "center", padding: "12px 16px", color: "var(--text-muted, #888)", fontSize: 13, width: 100 }}>등록일</th>
                <th style={{ textAlign: "center", padding: "12px 16px", color: "var(--text-muted, #888)", fontSize: 13, width: 120 }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {notices.map((notice) => (
                <tr key={notice.id} style={{ borderBottom: "1px solid var(--border-color, #222)" }}>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ fontWeight: 600 }}>{notice.title}</div>
                    <div style={{ fontSize: 13, color: "var(--text-muted, #888)", marginTop: 4 }}>
                      {notice.content.substring(0, 50)}...
                    </div>
                  </td>
                  <td style={{ textAlign: "center", padding: "14px 16px" }}>
                    <span style={{
                      padding: "4px 8px",
                      borderRadius: 999,
                      fontSize: 11,
                      background: notice.is_active ? "#22c55e22" : "#6b728022",
                      color: notice.is_active ? "#22c55e" : "#6b7280",
                    }}>
                      {notice.is_active ? "활성" : "비활성"}
                    </span>
                  </td>
                  <td style={{ textAlign: "center", padding: "14px 16px" }}>
                    {notice.is_pinned && <span style={{ color: "#eab308" }}>📌</span>}
                  </td>
                  <td style={{ textAlign: "center", padding: "14px 16px", fontSize: 13, color: "var(--text-muted, #888)" }}>
                    {formatDate(notice.created_at)}
                  </td>
                  <td style={{ textAlign: "center", padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                      <Link
                        href={`/admin/notices/${notice.id}`}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 6,
                          border: "1px solid var(--border-strong, #444)",
                          color: "var(--text-secondary, #aaa)",
                          textDecoration: "none",
                          fontSize: 12,
                        }}
                      >
                        수정
                      </Link>
                      <button
                        onClick={() => handleDelete(notice.id)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 6,
                          border: "1px solid #ef4444",
                          background: "transparent",
                          color: "#ef4444",
                          cursor: "pointer",
                          fontSize: 12,
                        }}
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
    </div>
  );
}
