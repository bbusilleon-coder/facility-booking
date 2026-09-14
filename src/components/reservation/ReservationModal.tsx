"use client";

import React, { useEffect, useMemo, useState } from "react";
import { calculateRentalFee, formatWon, getFreeRentalReason, getRentalPricing, RentalPricing } from "@/lib/rental-fee";

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

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 12px",
  borderRadius: 8,
  border: "1px solid var(--border-color, #333)",
  background: "var(--background, #0f0f0f)",
  color: "var(--foreground, white)",
  fontSize: 14,
};

export default function ReservationModal({ isOpen, onClose, facilityId, facilityName, selectedStart, selectedEnd, onSuccess }: Props) {
  const [step, setStep] = useState<"agreement" | "details">("agreement");
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pricing, setPricing] = useState<RentalPricing>(() => getRentalPricing({ name: facilityName }));
  const [isAdminBooking, setIsAdminBooking] = useState(false);
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

  useEffect(() => {
    if (!isOpen) return;
    setStep("agreement");
    setTermsAgreed(false);
    setPrivacyAgreed(false);
    setError(null);
    setFormData((prev) => ({
      ...prev,
      applicantName: localStorage.getItem("userName") || "",
      applicantEmail: localStorage.getItem("userEmail") || "",
      applicantPhone: localStorage.getItem("userPhone") || "",
      applicantDept: localStorage.getItem("userDept") || "",
    }));

    fetch(`/api/facilities/${facilityId}`)
      .then((res) => res.json())
      .then((json) => json.ok && setPricing(getRentalPricing(json.facility)))
      .catch(() => setPricing(getRentalPricing({ name: facilityName })));

    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken) {
      setIsAdminBooking(false);
    } else {
      fetch("/api/admin/auth", { headers: { Authorization: `Bearer ${adminToken}` } })
        .then((res) => res.json())
        .then((json) => setIsAdminBooking(Boolean(json.ok)))
        .catch(() => setIsAdminBooking(false));
    }
  }, [facilityId, facilityName, isOpen]);

  useEffect(() => {
    if (selectedStart && selectedEnd) {
      setFormData((prev) => ({ ...prev, startAt: formatDateTimeLocal(selectedStart), endAt: formatDateTimeLocal(selectedEnd) }));
    }
  }, [selectedStart, selectedEnd]);

  const fee = useMemo(() => {
    if (!formData.startAt || !formData.endAt) return { amount: 0, overtimeHours: 0, minutes: 0 };
    return calculateRentalFee(formData.startAt, formData.endAt, pricing);
  }, [formData.startAt, formData.endAt, pricing]);
  const freeRentalReason = getFreeRentalReason({
    facilityName,
    applicantName: formData.applicantName,
    applicantDept: formData.applicantDept,
    isAdminBooking,
  });
  const displayedAmount = freeRentalReason ? 0 : fee.amount;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: name === "attendees" ? parseInt(value) || 1 : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(formData.endAt) <= new Date(formData.startAt)) {
      setError("종료 시간은 시작 시간보다 늦어야 합니다.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const adminToken = localStorage.getItem("adminToken");
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(adminToken ? { Authorization: `Bearer ${adminToken}` } : {}),
        },
        body: JSON.stringify({
          facility_id: facilityId,
          start_at: formData.startAt,
          end_at: formData.endAt,
          purpose: formData.purpose,
          attendees: formData.attendees,
          applicant_name: formData.applicantName,
          applicant_phone: formData.applicantPhone,
          applicant_email: formData.applicantEmail,
          applicant_dept: formData.applicantDept,
          notes: formData.notes,
          agreed_terms: termsAgreed,
          agreed_privacy: privacyAgreed,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.message || "예약 신청 실패");
      alert(`예약 신청이 완료되었습니다.\n예상 사용료: ${formatWon(json.reservation?.rental_amount ?? displayedAmount)}`);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "예약 신청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.68)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }} onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="reservation-title" style={{ background: "var(--card-bg, #1a1a1a)", border: "1px solid var(--border-color, #333)", borderRadius: 16, padding: 24, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", color: "var(--foreground, white)", boxShadow: "0 24px 80px rgba(0,0,0,.45)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
          <div>
            <div style={{ color: "var(--color-primary, #60a5fa)", fontSize: 13, fontWeight: 700, marginBottom: 5 }}>{step === "agreement" ? "1 / 2  필수 동의" : "2 / 2  신청 정보"}</div>
            <h2 id="reservation-title" style={{ fontSize: 21, fontWeight: 800, margin: 0 }}>예약 신청</h2>
            <p style={{ color: "var(--text-muted, #999)", margin: "5px 0 0", fontSize: 14 }}>{facilityName}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="닫기" style={{ background: "transparent", border: 0, color: "var(--text-secondary, #aaa)", fontSize: 24, cursor: "pointer" }}>×</button>
        </div>

        {error && <div role="alert" style={{ background: "#3a1a1a", border: "1px solid #ef4444", borderRadius: 8, padding: 12, marginBottom: 16, color: "#fecaca", fontSize: 14 }}>{error}</div>}

        {step === "agreement" ? (
          <>
            <section style={{ background: "var(--background, #101010)", borderRadius: 10, padding: 16, marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, margin: "0 0 10px" }}>시설 이용수칙</h3>
              <ol style={{ margin: 0, paddingLeft: 20, color: "var(--text-muted, #aaa)", fontSize: 14, lineHeight: 1.75 }}>
                <li>승인된 목적·기간에만 사용하며 재임대하거나 담보로 제공하지 않습니다.</li>
                <li>시설과 물품을 용도에 맞게 사용합니다.</li>
                <li>훼손·분실·파손 시 즉시 알리고 실사용자가 원상복구 비용을 부담합니다.</li>
                <li>사용 종료 후 시설을 원상복구하여 반환합니다.</li>
              </ol>
            </section>
            <section style={{ background: "var(--background, #101010)", borderRadius: 10, padding: 16, marginBottom: 14 }}>
              <h3 style={{ fontSize: 15, margin: "0 0 8px" }}>개인정보 수집·이용</h3>
              <p style={{ margin: 0, color: "var(--text-muted, #aaa)", fontSize: 14, lineHeight: 1.65 }}>예약 처리와 연락을 위해 이름, 연락처, 이메일, 소속 정보를 수집합니다. 필수 정보 제공에 동의하지 않으면 예약 신청이 어렵습니다.</p>
            </section>
            <AgreementCheckbox checked={termsAgreed} onChange={setTermsAgreed}><strong>[필수]</strong> 시설 이용수칙에 동의합니다.</AgreementCheckbox>
            <AgreementCheckbox checked={privacyAgreed} onChange={setPrivacyAgreed}><strong>[필수]</strong> 개인정보 수집·이용에 동의합니다.</AgreementCheckbox>
            <button type="button" disabled={!termsAgreed || !privacyAgreed} onClick={() => setStep("details")} style={{ width: "100%", marginTop: 12, padding: "13px 16px", border: 0, borderRadius: 10, background: termsAgreed && privacyAgreed ? "var(--color-primary, #3b82f6)" : "#444", color: "white", cursor: termsAgreed && privacyAgreed ? "pointer" : "not-allowed", fontWeight: 700 }}>동의하고 신청 정보 입력</button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ background: "var(--background, #101010)", border: "1px solid var(--border-color, #333)", borderRadius: 10, padding: 14, marginBottom: 18 }}>
              <div style={{ fontSize: 13, color: "var(--text-muted, #888)" }}>{pricing.baseFee === 0 || freeRentalReason ? "대관 구분" : "자동 산정 사용료"}</div>
              <div style={{ fontSize: 23, fontWeight: 800, marginTop: 3 }}>{pricing.baseFee === 0 || freeRentalReason ? "무료 대관" : formatWon(displayedAmount)}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted, #777)", marginTop: 4 }}>{freeRentalReason === "admin" ? "관리자가 직접 신청한 예약으로 무상 대관이 적용됩니다." : freeRentalReason === "konyang-university" ? "건양대학교 관련 신청으로 무상 대관이 적용됩니다." : freeRentalReason === "senior" ? "계룡시니어 관련 신청으로 무상 대관이 적용됩니다." : pricing.baseFee === 0 ? "이 시설은 사용료가 부과되지 않습니다." : `기본 ${pricing.baseHours}시간 ${formatWon(pricing.baseFee)}${fee.overtimeHours > 0 ? ` + 초과 ${fee.overtimeHours}시간` : ""} · 최종 금액은 승인 시 확인`}</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12, marginBottom: 16 }}>
              <Field label="시작 일시 *"><input type="datetime-local" name="startAt" value={formData.startAt} onChange={handleChange} required style={inputStyle} /></Field>
              <Field label="종료 일시 *"><input type="datetime-local" name="endAt" value={formData.endAt} onChange={handleChange} required style={inputStyle} /></Field>
            </div>
            <Field label="사용 목적 *"><input name="purpose" value={formData.purpose} onChange={handleChange} required placeholder="예: 세미나, 회의, 교육" style={inputStyle} /></Field>
            <Field label="사용 인원 *"><input type="number" name="attendees" value={formData.attendees} onChange={handleChange} required min={1} style={inputStyle} /></Field>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
              <Field label="신청자 이름 *"><input name="applicantName" value={formData.applicantName} onChange={handleChange} required style={inputStyle} /></Field>
              <Field label="연락처 *"><input type="tel" name="applicantPhone" value={formData.applicantPhone} onChange={handleChange} required placeholder="010-0000-0000" style={inputStyle} /></Field>
              <Field label="이메일"><input type="email" name="applicantEmail" value={formData.applicantEmail} onChange={handleChange} style={inputStyle} /></Field>
              <Field label="소속/부서"><input name="applicantDept" value={formData.applicantDept} onChange={handleChange} style={inputStyle} /></Field>
            </div>
            <Field label="비고"><textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} placeholder="추가 요청사항" style={{ ...inputStyle, resize: "vertical" }} /></Field>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button type="button" onClick={() => setStep("agreement")} style={{ flex: 1, padding: 12, borderRadius: 10, border: "1px solid var(--border-strong, #444)", background: "transparent", color: "var(--text-secondary, #aaa)", cursor: "pointer" }}>이전</button>
              <button type="submit" disabled={loading} style={{ flex: 2, padding: 12, borderRadius: 10, border: 0, background: loading ? "#444" : "var(--color-primary, #3b82f6)", color: "white", cursor: loading ? "not-allowed" : "pointer", fontWeight: 700 }}>{loading ? "신청 중..." : "최종 예약 신청"}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label style={{ display: "block", marginBottom: 15, fontSize: 14, color: "var(--text-muted, #aaa)" }}><span style={{ display: "block", marginBottom: 6 }}>{label}</span>{children}</label>;
}

function AgreementCheckbox({ checked, onChange, children }: { checked: boolean; onChange: (checked: boolean) => void; children: React.ReactNode }) {
  return <label style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 0", cursor: "pointer", fontSize: 14 }}><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ marginTop: 2, width: 18, height: 18 }} /><span>{children}</span></label>;
}
