"use client";

import { useState, useEffect } from "react";

interface WaitlistItem {
  id: string;
  desired_date: string;
  desired_start_time: string;
  desired_end_time: string;
  applicant_name: string;
  applicant_phone: string;
  applicant_email: string | null;
  purpose: string | null;
  attendees: number;
  status: string;
  created_at: string;
  facility?: {
    id: string;
    name: string;
  };
}

const statusLabels: Record<string, string> = {
  waiting: "대기중",
  notified: "알림발송",
  cancelled: "취소됨",
  converted: "예약전환",
};

const statusColors: Record<string, string> = {
  waiting: "#eab308",
  notified: "#3b82f6",
  cancelled: "#6b7280",
  converted: "#22c55e",
};

export default function AdminWaitlistPage() {
  const [waitlist, setWaitlist] = useState<WaitlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWaitlist = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/waitlist");
      const json = await res.json();
      if (json.ok) {
        setWaitlist(json.waitlist || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaitlist();
  }, []);

  const handleCancel = async (id: string) => {
    if (!confirm("이 대기 신청을 취소하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/waitlist?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.ok) {
        fetchWaitlist();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotify = async (item: WaitlistItem) => {
    // 이메일이 있으면 알림 발송 (여기서는 상태만 변경)
    if (!item.applicant_email) {
      alert("이메일 주소가 없어 알림을 보낼 수 없습니다.");
      return;
    }

    alert(`${item.applicant_email}로 알림이 발송됩니다. (실제 이메일 발송은 EMAIL_USER/EMAIL_PASS 설정 필요)`);
  };

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>대기열 관리</h1>
      <p style={{ color: "var(--text-muted, #888)", marginBottom: 24, fontSize: 14 }}>
        예약 대기 신청 목록을 관리합니다.
      </p>

      {loading ? (
        <div style={{ color: "var(--text-muted, #888)", padding: 40, textAlign: "center" }}>로딩 중...</div>
      ) : waitlist.length === 0 ? (
        <div style={{
          padding: 40,
          background: "var(--card-bg, #1a1a1a)",
          borderRadius: 12,
          textAlign: "center",
          color: "var(--text-muted, #888)",
        }}>
          대기 신청이 없습니다.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {waitlist.map((item) => (
            <div
              key={item.id}
              style={{
                background: "var(--card-bg, #1a1a1a)",
                borderRadius: 12,
                padding: 16,
                borderLeft: `4px solid ${statusColors[item.status]}`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{item.facility?.name || "시설"}</span>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 999,
                        fontSize: 11,
                        background: `${statusColors[item.status]}22`,
                        color: statusColors[item.status],
                      }}
                    >
                      {statusLabels[item.status]}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-muted, #888)" }}>
                    희망일: {item.desired_date} {item.desired_start_time} ~ {item.desired_end_time}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-muted, #888)", marginTop: 4 }}>
                    {item.applicant_name} · {item.applicant_phone}
                    {item.applicant_email && ` · ${item.applicant_email}`}
                  </div>
                  {item.purpose && (
                    <div style={{ fontSize: 13, color: "var(--text-muted, #666)", marginTop: 4 }}>
                      목적: {item.purpose} · {item.attendees}명
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
                    신청일: {new Date(item.created_at).toLocaleString("ko-KR")}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  {item.status === "waiting" && (
                    <>
                      <button
                        onClick={() => handleNotify(item)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 6,
                          border: "1px solid #3b82f6",
                          background: "transparent",
                          color: "#3b82f6",
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                      >
                        알림발송
                      </button>
                      <button
                        onClick={() => handleCancel(item.id)}
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
                        취소
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
