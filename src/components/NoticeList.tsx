"use client";

import { useEffect, useState } from "react";

type Notice = {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
};

export default function NoticeList() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const res = await fetch("/api/notices?active=true&limit=5");
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

    fetchNotices();
  }, []);

  if (loading) {
    return (
      <div className="skeleton" style={{ height: 60, borderRadius: 12, marginBottom: 16 }} />
    );
  }

  if (notices.length === 0) {
    return null;
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ko-KR");
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "var(--text-muted, #888)" }}>
        📢 공지사항
      </h3>
      <div style={{ background: "var(--card-bg, #1a1a1a)", borderRadius: 12, overflow: "hidden" }}>
        {notices.map((notice, idx) => (
          <div
            key={notice.id}
            style={{
              borderBottom: idx < notices.length - 1 ? "1px solid var(--border-color, #222)" : "none",
            }}
          >
            <div
              onClick={() => setExpanded(expanded === notice.id ? null : notice.id)}
              style={{
                padding: "12px 16px",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {notice.is_pinned && <span style={{ color: "#eab308" }}>📌</span>}
                <span style={{ fontSize: 14, color: "var(--foreground, white)" }}>{notice.title}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 12, color: "var(--text-muted, #666)" }}>{formatDate(notice.created_at)}</span>
                <span style={{ color: "var(--text-muted, #666)", fontSize: 12 }}>
                  {expanded === notice.id ? "▲" : "▼"}
                </span>
              </div>
            </div>
            
            {expanded === notice.id && (
              <div style={{
                padding: "0 16px 16px",
                fontSize: 14,
                color: "var(--text-muted, #aaa)",
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
              }}>
                {notice.content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
