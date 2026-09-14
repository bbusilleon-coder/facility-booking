"use client";

import React, { useState } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  facilityId: string;
  facilityName: string;
  onSuccess: () => void;
};

const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

export default function RecurringReservationModal({
  isOpen,
  onClose,
  facilityId,
  facilityName,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    created: number;
    conflicts: { date: string; reason: string }[];
    skipped: { date: string; reason: string }[];
  } | null>(null);

  const [formData, setFormData] = useState({
    startTime: "09:00",
    endTime: "11:00",
    purpose: "",
    attendees: 1,
    applicantName: "",
    applicantPhone: "",
    applicantEmail: "",
    applicantDept: "",
    notes: "",
    repeatType: "weekly",
    repeatDays: [1, 3, 5], // 월수금
    startDate: "",
    endDate: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "attendees" ? parseInt(value) || 1 : value,
    }));
  };

  const handleDayToggle = (day: number) => {
    setFormData((prev) => ({
      ...prev,
      repeatDays: prev.repeatDays.includes(day)
        ? prev.repeatDays.filter((d) => d !== day)
        : [...prev.repeatDays, day].sort(),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.repeatDays.length === 0 && formData.repeatType !== "monthly") {
      setError("반복할 요일을 선택해주세요.");
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      setError("시작일과 종료일을 선택해주세요.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const adminToken = localStorage.getItem("adminToken");
      const res = await fetch("/api/reservations/recurring", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
        },
        body: JSON.stringify({
          facility_id: facilityId,
          start_time: formData.startTime,
          end_time: formData.endTime,
          purpose: formData.purpose,
          attendees: formData.attendees,
          applicant_name: formData.applicantName,
          applicant_phone: formData.applicantPhone,
          applicant_email: formData.applicantEmail,
          applicant_dept: formData.applicantDept,
          notes: formData.notes,
          repeat_type: formData.repeatType,
          repeat_days: formData.repeatDays,
          start_date: formData.startDate,
          end_date: formData.endDate,
        }),
      });

      const json = await res.json();

      if (!json.ok && json.created === undefined) {
        throw new Error(json.message || "정기 예약 신청 실패");
      }

      setResult({
        created: json.created || 0,
        conflicts: json.conflicts || [],
        skipped: json.skipped || [],
      });

      if (json.created > 0) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

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
      onClick={handleClose}
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
          🔄 정기 예약 신청
        </h2>
        <p style={{ color: "#888", marginBottom: 16 }}>{facilityName}</p>

        {/* 결과 표시 */}
        {result && (
          <div style={{
            background: result.created > 0 ? "#1a3a1a" : "#3a1a1a",
            border: `1px solid ${result.created > 0 ? "#4a4" : "#f44"}`,
            borderRadius: 8,
            padding: 16,
            marginBottom: 16,
          }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>
              {result.created > 0 
                ? `✅ ${result.created}건의 예약이 신청되었습니다.`
                : "❌ 예약을 생성하지 못했습니다."
              }
            </div>
            {result.conflicts.length > 0 && (
              <div style={{ fontSize: 13, color: "#faa", marginTop: 8 }}>
                ⚠️ 중복으로 건너뛴 날짜: {result.conflicts.map(c => c.date).join(", ")}
              </div>
            )}
            {result.skipped.length > 0 && (
              <div style={{ fontSize: 13, color: "#aaa", marginTop: 4 }}>
                휴무/휴일로 건너뛴 날짜: {result.skipped.map(s => s.date).join(", ")}
              </div>
            )}
            <button
              onClick={handleClose}
              style={{
                marginTop: 12,
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                background: "#3b82f6",
                color: "white",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              확인
            </button>
          </div>
        )}

        {!result && (
          <>
            {error && (
              <div style={{
                background: "#3a1a1a",
                border: "1px solid #f44",
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
                color: "#faa",
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* 반복 유형 */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>반복 유형 *</label>
                <select
                  name="repeatType"
                  value={formData.repeatType}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="weekly">매주</option>
                  <option value="biweekly">격주</option>
                  <option value="monthly">매월 (같은 날짜)</option>
                </select>
              </div>

              {/* 요일 선택 (매주/격주) */}
              {(formData.repeatType === "weekly" || formData.repeatType === "biweekly") && (
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>반복 요일 *</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {dayNames.map((name, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleDayToggle(idx)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 8,
                          border: "1px solid #333",
                          background: formData.repeatDays.includes(idx) ? "#3b82f6" : "#0f0f0f",
                          color: formData.repeatDays.includes(idx) ? "white" : "#888",
                          cursor: "pointer",
                          fontSize: 13,
                        }}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 기간 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>시작일 *</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>종료일 *</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* 시간 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={labelStyle}>시작 시간 *</label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>종료 시간 *</label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* 사용 목적 */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>사용 목적 *</label>
                <input
                  type="text"
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleChange}
                  required
                  placeholder="예: 정기 회의, 주간 교육 등"
                  style={inputStyle}
                />
              </div>

              {/* 참석 인원 */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>참석 인원 *</label>
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
                  <label style={labelStyle}>신청자 이름 *</label>
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
                  <label style={labelStyle}>연락처 *</label>
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
                  <label style={labelStyle}>이메일</label>
                  <input
                    type="email"
                    name="applicantEmail"
                    value={formData.applicantEmail}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>소속/부서</label>
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
                <label style={labelStyle}>비고</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={2}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              {/* 버튼 */}
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  type="button"
                  onClick={handleClose}
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
                    background: loading ? "#444" : "#8b5cf6",
                    color: "white",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {loading ? "처리 중..." : "정기 예약 신청"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

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
