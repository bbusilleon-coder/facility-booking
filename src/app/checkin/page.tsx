"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function CheckinContent() {
  const searchParams = useSearchParams();
  const codeParam = searchParams.get("code");

  const [code, setCode] = useState(codeParam || "");
  const [loading, setLoading] = useState(false);
  const [reservation, setReservation] = useState<any>(null);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  useEffect(() => {
    if (codeParam) {
      handleCheck();
    }
  }, [codeParam]);

  const handleCheck = async () => {
    if (!code) return;

    setLoading(true);
    setMessage(null);
    setReservation(null);

    try {
      const res = await fetch(`/api/checkin?code=${code}`);
      const json = await res.json();

      if (!json.ok) {
        setMessage({ type: "error", text: json.message });
        if (json.reservation) {
          setReservation(json.reservation);
        }
        return;
      }

      setReservation(json.reservation);
      
      if (json.reservation.checkedIn) {
        setMessage({ type: "info", text: "이미 체크인 되었습니다." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "조회에 실패했습니다." });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckin = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const json = await res.json();

      if (!json.ok) {
        setMessage({ type: "error", text: json.message });
        return;
      }

      setMessage({ type: "success", text: "체크인이 완료되었습니다! 🎉" });
      setReservation({ ...reservation, checkedIn: true, checkedInAt: json.checkedInAt });
    } catch (err) {
      setMessage({ type: "error", text: "체크인에 실패했습니다." });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("ko-KR", {
      month: "long",
      day: "numeric",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div style={{
      width: "100%",
      maxWidth: 400,
      background: "var(--card-bg, #1a1a1a)",
      borderRadius: 16,
      padding: 32,
      textAlign: "center",
    }}>
      <Link href="/" style={{ color: "var(--text-muted, #888)", fontSize: 13, textDecoration: "none" }}>
        ← 홈으로 돌아가기
      </Link>

      <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 16, marginBottom: 8 }}>
        📱 QR 체크인
      </h1>
      <p style={{ color: "var(--text-muted, #888)", marginBottom: 24, fontSize: 14 }}>
        예약 코드를 입력하거나 QR코드를 스캔하세요.
      </p>

      {/* 코드 입력 */}
      <div style={{ marginBottom: 24 }}>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="예약 코드 (8자리)"
          maxLength={8}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: 12,
            border: "2px solid var(--border-color, #333)",
            background: "var(--background, #0f0f0f)",
            color: "var(--foreground, white)",
            fontSize: 24,
            textAlign: "center",
            letterSpacing: 4,
            fontFamily: "monospace",
          }}
        />
        <button
          onClick={handleCheck}
          disabled={loading || code.length < 8}
          style={{
            width: "100%",
            marginTop: 12,
            padding: "14px",
            borderRadius: 10,
            border: "none",
            background: loading || code.length < 8 ? "#444" : "var(--color-primary, #3b82f6)",
            color: "white",
            cursor: loading || code.length < 8 ? "not-allowed" : "pointer",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {loading ? "확인 중..." : "예약 확인"}
        </button>
      </div>

      {/* 메시지 */}
      {message && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            marginBottom: 16,
            background: message.type === "success" ? "#1a3a1a" : message.type === "error" ? "#3a1a1a" : "#1a2a3a",
            border: `1px solid ${message.type === "success" ? "#22c55e" : message.type === "error" ? "#ef4444" : "#3b82f6"}`,
            color: message.type === "success" ? "#4ade80" : message.type === "error" ? "#fca5a5" : "#93c5fd",
            fontSize: 14,
          }}
        >
          {message.text}
        </div>
      )}

      {/* 예약 정보 */}
      {reservation && (
        <div style={{
          background: "var(--background, #0f0f0f)",
          borderRadius: 12,
          padding: 20,
          textAlign: "left",
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
            {reservation.facility}
          </h3>
          
          <div style={{ fontSize: 14, color: "var(--text-muted, #888)", marginBottom: 8 }}>
            📍 {reservation.location || "위치 정보 없음"}
          </div>
          
          <div style={{ fontSize: 14, marginBottom: 4 }}>
            <strong>시작:</strong> {formatDate(reservation.startAt)}
          </div>
          <div style={{ fontSize: 14, marginBottom: 12 }}>
            <strong>종료:</strong> {formatDate(reservation.endAt)}
          </div>

          {reservation.applicant && (
            <div style={{ fontSize: 14, color: "var(--text-muted, #888)", marginBottom: 4 }}>
              신청자: {reservation.applicant}
            </div>
          )}

          {reservation.checkedIn ? (
            <div style={{
              marginTop: 16,
              padding: "12px",
              borderRadius: 8,
              background: "#22c55e22",
              color: "#22c55e",
              textAlign: "center",
              fontWeight: 600,
            }}>
              ✅ 체크인 완료
              <div style={{ fontSize: 12, marginTop: 4, fontWeight: 400 }}>
                {reservation.checkedInAt && formatDate(reservation.checkedInAt)}
              </div>
            </div>
          ) : (
            <button
              onClick={handleCheckin}
              disabled={loading}
              style={{
                width: "100%",
                marginTop: 16,
                padding: "14px",
                borderRadius: 10,
                border: "none",
                background: loading ? "#444" : "#22c55e",
                color: "white",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              {loading ? "처리 중..." : "체크인 하기"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function CheckinPage() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--background, #0a0a0a)",
      padding: 24,
    }}>
      <Suspense fallback={
        <div style={{
          width: "100%",
          maxWidth: 400,
          background: "var(--card-bg, #1a1a1a)",
          borderRadius: 16,
          padding: 32,
          textAlign: "center",
          color: "var(--text-muted, #888)",
        }}>
          로딩 중...
        </div>
      }>
        <CheckinContent />
      </Suspense>
    </div>
  );
}
