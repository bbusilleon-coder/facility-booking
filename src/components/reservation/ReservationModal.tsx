"use client";

import React, { useState, useEffect } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  facilityId: string;
  facilityName: string;
  selectedStart: Date | null;
  selectedEnd: Date | null;
  onSuccess: () => void;
};

function formatDateTimeLocal(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function ReservationModal({
  isOpen,
  onClose,
  facilityId,
  facilityName,
  selectedStart,
  selectedEnd,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    startAt: "",
    endAt: "",
    purpose: "",
    attendees: 1,
    applicantName: "",
    applicantPhone: "",
    applicantEmail: "",
    applicantDept: "",
    notes: "",
  });

  // 모달이 열릴 때 로그인된 사용자 정보 자동 채우기
  useEffect(() => {
    if (isOpen) {
      const userName = localStorage.getItem("userName") || "";
      const userEmail = localStorage.getItem("userEmail") || "";
      const userPhone = localStorage.getItem("userPhone") || "";
      const userDept = localStorage.getItem("userDept") || "";

      setFormData((prev) => ({
        ...prev,
        applicantName: userName,
        applicantEmail: userEmail,
        applicantPhone: userPhone,
        applicantDept: userDept,
      }));
    }
  }, [isOpen]);

  // 선택된 시간이 변경되면 폼 업데이트
  useEffect(() => {
    if (selectedStart && selectedEnd) {
      setFormData((prev) => ({
        ...prev,
        startAt: formatDateTimeLocal(selectedStart),
        endAt: formatDateTimeLocal(selectedEnd),
      }));
    }
  }, [selectedStart, selectedEnd]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "attendees" ? parseInt(value) || 1 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 시간 유효성 체크
    const start = new Date(formData.startAt);
    const end = new Date(formData.endAt);
    
    if (end <= start) {
      setError("종료 시간은 시작 시간보다 늦어야 합니다.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facility_id: facilityId,
          start_at: start.toISOString(),
          end_at: end.toISOString(),
          purpose: formData.purpose,
          attendees: formData.attendees,
          applicant_name: formData.applicantName,
          applicant_phone: formData.applicantPhone,
          applicant_email: formData.applicantEmail,
          applicant_dept: formData.applicantDept,
          notes: formData.notes,
        }),
      });

      const json = await res.json();

      if (!json.ok) {
        throw new Error(json.message || "예약 신청 실패");
      }

      alert("예약 신청이 완료되었습니다. 승인을 기다려주세요.");
      
      // 폼 초기화 (사용자 정보는 유지)
      const userName = localStorage.getItem("userName") || "";
      const userEmail = localStorage.getItem("userEmail") || "";
      const userPhone = localStorage.getItem("userPhone") || "";
      const userDept = localStorage.getItem("userDept") || "";

      setFormData({
        startAt: "",
        endAt: "",
        purpose: "",
        attendees: 1,
        applicantName: userName,
        applicantPhone: userPhone,
        applicantEmail: userEmail,
        applicantDept: userDept,
        notes: "",
      });
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // 선택된 시간 표시
  const formatDateTime = (date: Date | null) => {
    if (!date) return "-";
    return date.toLocaleString("ko-KR", {
      month: "long",
      day: "numeric",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#1a1a1a",
          borderRadius: 16,
          padding: 24,
          width: "100%",
          maxWidth: 500,
          maxHeight: "90vh",
          overflowY: "auto",
          color: "white",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
          예약 신청
        </h2>
        <p style={{ color: "#888", marginBottom: 16 }}>{facilityName}</p>

        {/* 선택된 시간 표시 */}
        {selectedStart && selectedEnd && (
          <div style={{
            background: "#0f0f0f",
            border: "1px solid #333",
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>선택한 시간</div>
            <div style={{ fontSize: 14 }}>
              {formatDateTime(selectedStart)} ~ {formatDateTime(selectedEnd)}
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              background: "#3a1a1a",
              border: "1px solid #f44",
              borderRadius: 8,
              padding: 12,
              marginBottom: 16,
              color: "#faa",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* 시작/종료 시간 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "#aaa" }}>
                시작 일시 *
              </label>
              <input
                type="datetime-local"
                name="startAt"
                value={formData.startAt}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "#aaa" }}>
                종료 일시 *
              </label>
              <input
                type="datetime-local"
                name="endAt"
                value={formData.endAt}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </div>
          </div>

          {/* 사용 목적 */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "#aaa" }}>
              사용 목적 *
            </label>
            <input
              type="text"
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              required
              placeholder="예: 팀 회의, 세미나, 교육 등"
              style={inputStyle}
            />
          </div>

          {/* 참석 인원 */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "#aaa" }}>
              참석 인원 *
            </label>
            <input
              type="number"
              name="attendees"
              value={formData.attendees}
              onChange={handleChange}
              required
              min={1}
              style={inputStyle}
            />
          </div>

          {/* 신청자 정보 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "#aaa" }}>
                신청자 이름 *
              </label>
              <input
                type="text"
                name="applicantName"
                value={formData.applicantName}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "#aaa" }}>
                연락처 *
              </label>
              <input
                type="tel"
                name="applicantPhone"
                value={formData.applicantPhone}
                onChange={handleChange}
                required
                placeholder="010-0000-0000"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "#aaa" }}>
                이메일
              </label>
              <input
                type="email"
                name="applicantEmail"
                value={formData.applicantEmail}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "#aaa" }}>
                소속/부서
              </label>
              <input
                type="text"
                name="applicantDept"
                value={formData.applicantDept}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
          </div>

          {/* 비고 */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "#aaa" }}>
              비고
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="추가 요청사항이 있으면 입력해주세요."
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {/* 버튼 */}
          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "12px 16px",
                borderRadius: 10,
                border: "1px solid #444",
                background: "transparent",
                color: "#aaa",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: "12px 16px",
                borderRadius: 10,
                border: "none",
                background: loading ? "#444" : "#3b82f6",
                color: "white",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {loading ? "신청 중..." : "예약 신청"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #333",
  background: "#0f0f0f",
  color: "white",
  fontSize: 14,
};
