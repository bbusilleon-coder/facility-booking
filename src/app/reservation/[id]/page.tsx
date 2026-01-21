"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

type Reservation = {
  id: string;
  facility_id: string;
  start_at: string;
  end_at: string;
  status: string;
  purpose: string;
  attendees: number;
  applicant_name: string;
  applicant_phone: string;
  applicant_email: string | null;
  applicant_dept: string | null;
  notes: string | null;
  facility?: {
    id: string;
    name: string;
    location: string | null;
  };
};

function formatDateTimeLocal(dateStr: string): string {
  const date = new Date(dateStr);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function EditReservationPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifyPhone, setVerifyPhone] = useState("");
  const [verified, setVerified] = useState(false);

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
    const fetchReservation = async () => {
      try {
        const res = await fetch(`/api/reservations/${id}`);
        const json = await res.json();

        if (!json.ok) {
          throw new Error(json.message || "예약을 찾을 수 없습니다.");
        }

        setReservation(json.reservation);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setFetching(false);
      }
    };

    if (id) fetchReservation();
  }, [id]);

  const handleVerify = () => {
    if (!reservation) return;
    
    const normalizedInput = verifyPhone.replace(/-/g, "");
    const normalizedStored = reservation.applicant_phone.replace(/-/g, "");
    
    if (normalizedInput === normalizedStored) {
      setVerified(true);
      setFormData({
        startAt: formatDateTimeLocal(reservation.start_at),
        endAt: formatDateTimeLocal(reservation.end_at),
        purpose: reservation.purpose,
        attendees: reservation.attendees,
        applicantName: reservation.applicant_name,
        applicantPhone: reservation.applicant_phone,
        applicantEmail: reservation.applicant_email || "",
        applicantDept: reservation.applicant_dept || "",
        notes: reservation.notes || "",
      });
    } else {
      alert("연락처가 일치하지 않습니다.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "attendees" ? parseInt(value) || 1 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_at: new Date(formData.startAt).toISOString(),
          end_at: new Date(formData.endAt).toISOString(),
          purpose: formData.purpose,
          attendees: formData.attendees,
          applicant_name: formData.applicantName,
          applicant_phone: formData.applicantPhone,
          applicant_email: formData.applicantEmail || null,
          applicant_dept: formData.applicantDept || null,
          notes: formData.notes || null,
        }),
      });

      const json = await res.json();

      if (!json.ok) {
        throw new Error(json.message || "수정 실패");
      }

      alert("예약이 수정되었습니다.");
      router.push("/reservation");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <main style={{ padding: 24, color: "white", maxWidth: 600, margin: "0 auto" }}>
        <div style={{ color: "#888" }}>로딩 중...</div>
      </main>
    );
  }

  if (!reservation) {
    return (
      <main style={{ padding: 24, color: "white", maxWidth: 600, margin: "0 auto" }}>
        <div style={{ color: "#f44" }}>{error || "예약을 찾을 수 없습니다."}</div>
        <Link href="/reservation" style={{ color: "#3b82f6", marginTop: 16, display: "inline-block" }}>
          ← 돌아가기
        </Link>
      </main>
    );
  }

  // 수정 불가능한 상태
  if (reservation.status !== "pending") {
    return (
      <main style={{ padding: 24, color: "white", maxWidth: 600, margin: "0 auto" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>예약 수정</h1>
        <div style={{
          padding: 24,
          background: "#1a1a1a",
          borderRadius: 12,
          textAlign: "center",
        }}>
          <p style={{ color: "#888", marginBottom: 16 }}>
            {reservation.status === "approved" && "승인된 예약은 수정할 수 없습니다."}
            {reservation.status === "rejected" && "거절된 예약은 수정할 수 없습니다."}
            {reservation.status === "cancelled" && "취소된 예약은 수정할 수 없습니다."}
          </p>
          <Link href="/reservation" style={{ color: "#3b82f6" }}>
            ← 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  // 본인 확인 전
  if (!verified) {
    return (
      <main style={{ padding: 24, color: "white", maxWidth: 400, margin: "0 auto" }}>
        <Link href="/reservation" style={{ color: "#3b82f6", fontSize: 14 }}>
          ← 돌아가기
        </Link>

        <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 12, marginBottom: 24 }}>
          본인 확인
        </h1>

        <div style={{ background: "#1a1a1a", borderRadius: 12, padding: 24 }}>
          <p style={{ color: "#888", marginBottom: 16, fontSize: 14 }}>
            예약 시 입력한 연락처를 입력해주세요.
          </p>
          
          <input
            type="tel"
            value={verifyPhone}
            onChange={(e) => setVerifyPhone(e.target.value)}
            placeholder="010-0000-0000"
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 10,
              border: "1px solid #333",
              background: "#0f0f0f",
              color: "white",
              fontSize: 16,
              marginBottom: 16,
            }}
          />

          <button
            onClick={handleVerify}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 10,
              border: "none",
              background: "#3b82f6",
              color: "white",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            확인
          </button>
        </div>
      </main>
    );
  }

  // 수정 폼
  return (
    <main style={{ padding: 24, color: "white", maxWidth: 600, margin: "0 auto" }}>
      <Link href="/reservation" style={{ color: "#3b82f6", fontSize: 14 }}>
        ← 내 예약 조회
      </Link>

      <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 12, marginBottom: 8 }}>
        예약 수정
      </h1>
      <p style={{ color: "#888", marginBottom: 24 }}>
        {reservation.facility?.name}
      </p>

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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>시작 일시</label>
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
            <label style={labelStyle}>종료 일시</label>
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

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>사용 목적</label>
          <input
            type="text"
            name="purpose"
            value={formData.purpose}
            onChange={handleChange}
            required
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>참석 인원</label>
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>신청자 이름</label>
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
            <label style={labelStyle}>연락처</label>
            <input
              type="tel"
              name="applicantPhone"
              value={formData.applicantPhone}
              onChange={handleChange}
              required
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

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>비고</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <Link
            href="/reservation"
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 10,
              border: "1px solid #444",
              background: "transparent",
              color: "#aaa",
              textDecoration: "none",
              textAlign: "center",
              fontSize: 14,
            }}
          >
            취소
          </Link>
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
            {loading ? "저장 중..." : "저장"}
          </button>
        </div>
      </form>
    </main>
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
