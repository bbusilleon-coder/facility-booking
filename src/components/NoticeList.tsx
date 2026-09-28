"use client";

import { useEffect, useState } from "react";

type Notice = { id: string; title: string; content: string; is_pinned: boolean; created_at: string; };

export default function NoticeList() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotices = async () => {
      try { const res = await fetch("/api/notices?active=true&limit=5"); const json = await res.json(); if (json.ok) setNotices(json.notices || []); }
      catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchNotices();
  }, []);

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\. /g, ".").replace(/\.$/, "");

  return <article className="ky-notice-panel" id="notices">
    <div className="ky-section-heading ky-section-heading-compact"><div><p className="ky-eyebrow ky-dark">NOTICE</p><h2>공지사항</h2></div><span className="ky-more" aria-hidden="true">＋</span></div>
    {loading ? <div className="ky-loading-block" /> : notices.length === 0 ? <p className="ky-empty-message">등록된 공지사항이 없습니다.</p> : <div className="ky-notice-list">
      {notices.map((notice) => { const isOpen = expanded === notice.id; return <div className="ky-notice-entry" key={notice.id}>
        <button type="button" className="ky-notice-item" aria-expanded={isOpen} onClick={() => setExpanded(isOpen ? null : notice.id)}>
          <span className={`ky-notice-tag${notice.is_pinned ? "" : " ky-muted"}`}>{notice.is_pinned ? "중요" : "안내"}</span><span className="ky-notice-title">{notice.title}</span><time dateTime={notice.created_at}>{formatDate(notice.created_at)}</time><span className="ky-chevron" aria-hidden="true">⌄</span>
        </button>{isOpen && <div className="ky-notice-detail">{notice.content}</div>}
      </div>; })}
    </div>}
  </article>;
}
