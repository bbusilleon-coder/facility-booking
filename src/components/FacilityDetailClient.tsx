"use client";

import { useState } from "react";
import ReviewList from "./ReviewList";

interface FacilityDetailClientProps {
  facilityId: string;
  facilityName: string;
}

export default function FacilityDetailClient({ facilityId, facilityName }: FacilityDetailClientProps) {
  const [showWaitlistForm, setShowWaitlistForm] = useState(false);
  const [waitlistForm, setWaitlistForm] = useState({
    desired_date: "",
    desired_start_time: "09:00",
    desired_end_time: "10:00",
    applicant_name: "",
    applicant_phone: "",
    applicant_email: "",
    purpose: "",
    attendees: 1,
  });
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistMessage, setWaitlistMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaitlistLoading(true);
    setWaitlistMessage(null);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facility_id: facilityId,
          ...waitlistForm,
        }),
      });

      const json = await res.json();

      if (!json.ok) {
        throw new Error(json.message);
      }

      setWaitlistMessage({ type: "success", text: "대기 신청이 완료되었습니다. 예약 가능 시 알림을 보내드립니다." });
      setShowWaitlistForm(false);
      setWaitlistForm({
        ...waitlistForm,
        desired_date: "",
        purpose: "",
      });
    } catch (err: any) {
      setWaitlistMessage({ type: "error", text: err.message });
    } finally {
      setWaitlistLoading(false);
    }
  };

  return (
    <>
      {/* 대기열 신청 */}
      <div style={{
        background: "var(--card-bg, #1a1a1a)",
        borderRadius: 16,
        padding: 24,
        marginBottom: 32,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>⏰ 예약 대기</h2>
          <button
            onClick={() => setShowWaitlistForm(!showWaitlistForm)}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid var(--color-primary, #3b82f6)",
              background: "transparent",
              color: "var(--color-primary, #3b82f6)",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            {showWaitlistForm ? "취소" : "대기 신청"}
          </button>
        </div>

        <p style={{ color: "var(--text-muted, #888)", fontSize: 14, margin: 0 }}>
          원하는 시간에 예약이 꽉 찼나요? 대기 신청을 하시면 취소 발생 시 알림을 보내드립니다.
        </p>

        {waitlistMessage && (
          <div
            style={{
              marginTop: 16,
              padding: "12px 16px",
              borderRadius: 8,
              background: waitlistMessage.type === "success" ? "#1a3a1a" : "#3a1a1a",
              border: `1px solid ${waitlistMessage.type === "success" ? "#22c55e" : "#ef4444"}`,
              color: waitlistMessage.type === "success" ? "#4ade80" : "#fca5a5",
              fontSize: 14,
            }}
          >
            {waitlistMessage.text}
          </div>
        )}

        {showWaitlistForm && (
          <form onSubmit={handleWaitlistSubmit} style={{ marginTop: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>희망 날짜 *</label>
                <input
                  type="date"
                  value={waitlistForm.desired_date}
                  onChange={(e) => setWaitlistForm({ ...waitlistForm, desired_date: e.target.value })}
                  required
                  min={new Date().toISOString().split("T")[0]}
                  style={inputStyle}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <label style={labelStyle}>시작 시간</label>
                  <input
                    type="time"
                    value={waitlistForm.desired_start_time}
                    onChange={(e) => setWaitlistForm({ ...waitlistForm, desired_start_time: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>종료 시간</label>
                  <input
                    type="time"
                    value={waitlistForm.desired_end_time}
                    onChange={(e) => setWaitlistForm({ ...waitlistForm, desired_end_time: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
              <div>
                <label style={labelStyle}>이름 *</label>
                <input
                  type="text"
                  value={waitlistForm.applicant_name}
                  onChange={(e) => setWaitlistForm({ ...waitlistForm, applicant_name: e.target.value })}
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>연락처 *</label>
                <input
                  type="tel"
                  value={waitlistForm.applicant_phone}
                  onChange={(e) => setWaitlistForm({ ...waitlistForm, applicant_phone: e.target.value })}
                  required
                  placeholder="010-0000-0000"
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
              <div>
                <label style={labelStyle}>이메일</label>
                <input
                  type="email"
                  value={waitlistForm.applicant_email}
                  onChange={(e) => setWaitlistForm({ ...waitlistForm, applicant_email: e.target.value })}
                  placeholder="선택사항"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>인원</label>
                <input
                  type="number"
                  value={waitlistForm.attendees}
                  onChange={(e) => setWaitlistForm({ ...waitlistForm, attendees: parseInt(e.target.value) || 1 })}
                  min={1}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <label style={labelStyle}>사용 목적</label>
              <input
                type="text"
                value={waitlistForm.purpose}
                onChange={(e) => setWaitlistForm({ ...waitlistForm, purpose: e.target.value })}
                placeholder="예: 회의, 강의, 행사 등"
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={waitlistLoading}
              style={{
                marginTop: 16,
                width: "100%",
                padding: "12px",
                borderRadius: 10,
                border: "none",
                background: waitlistLoading ? "#444" : "var(--color-primary, #3b82f6)",
                color: "white",
                cursor: waitlistLoading ? "not-allowed" : "pointer",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {waitlistLoading ? "신청 중..." : "대기 신청하기"}
            </button>
          </form>
        )}
      </div>

      {/* 리뷰 목록 */}
      <div style={{
        background: "var(--card-bg, #1a1a1a)",
        borderRadius: 16,
        padding: 24,
      }}>
        <ReviewList facilityId={facilityId} />
      </div>
    </>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 6,
  fontSize: 13,
  color: "var(--text-muted, #aaa)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid var(--border-color, #333)",
  background: "var(--background, #0f0f0f)",
  color: "var(--foreground, white)",
  fontSize: 14,
};
