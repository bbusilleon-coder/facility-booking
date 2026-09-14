"use client";

import { useState } from "react";

type ExportType = "all" | "pending" | "approved" | "today" | "week";

const statusLabels: Record<string, string> = {
  pending: "승인대기",
  approved: "승인됨",
  rejected: "거절됨",
  cancelled: "취소됨",
};

export default function ExportButton() {
  const [isExporting, setIsExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const formatDateForExcel = (dateStr: string) => {
    if (!dateStr) return "";
    if (!dateStr.includes("Z") && !dateStr.includes("+")) {
      const [datePart, timePart] = dateStr.split("T");
      if (!datePart || !timePart) return dateStr;
      const [year, month, day] = datePart.split("-");
      const [hour, minute] = timePart.split(":");
      return `${year}-${month}-${day} ${hour}:${minute}`;
    }
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hour = String(d.getHours()).padStart(2, "0");
    const minute = String(d.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hour}:${minute}`;
  };

  const handleExport = async (type: ExportType) => {
    setIsExporting(true);
    setShowMenu(false);

    try {
      // API 파라미터 설정
      const params = new URLSearchParams();
      const today = new Date();
      
      if (type === "pending") {
        params.append("status", "pending");
      } else if (type === "approved") {
        params.append("status", "approved");
      } else if (type === "today") {
        const todayStr = today.toISOString().split("T")[0];
        params.append("dateFrom", todayStr);
        params.append("dateTo", todayStr);
      } else if (type === "week") {
        const dayOfWeek = today.getDay();
        const weekStart = new Date(today.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
        params.append("dateFrom", weekStart.toISOString().split("T")[0]);
        params.append("dateTo", weekEnd.toISOString().split("T")[0]);
      }

      const res = await fetch(`/api/reservations?${params}`);
      const json = await res.json();

      if (!json.ok || !json.reservations) {
        alert("데이터를 불러오는데 실패했습니다.");
        return;
      }

      const reservations = json.reservations;

      if (reservations.length === 0) {
        alert("내보낼 데이터가 없습니다.");
        return;
      }

      // CSV 생성
      const headers = [
        "예약번호", "시설명", "상태", "시작일시", "종료일시",
        "신청자", "연락처", "이메일", "소속", "사용목적",
        "인원", "비고", "체크인시간", "신청일"
      ];

      const rows = reservations.map((r: any) => [
        r.id.slice(0, 8).toUpperCase(),
        r.facility?.name || "",
        statusLabels[r.status] || r.status,
        formatDateForExcel(r.start_at),
        formatDateForExcel(r.end_at),
        r.applicant_name || r.booker_name || "",
        r.applicant_phone || r.booker_phone || "",
        r.applicant_email || "",
        r.applicant_dept || "",
        r.purpose || "",
        r.attendees || 1,
        r.notes || "",
        r.checked_in_at ? formatDateForExcel(r.checked_in_at) : "",
        formatDateForExcel(r.created_at),
      ]);

      const BOM = "\uFEFF";
      const csvContent = BOM + [
        headers.join(","),
        ...rows.map((row: any[]) =>
          row.map((cell) => {
            const str = String(cell).replace(/"/g, '""');
            return str.includes(",") || str.includes('"') || str.includes("\n")
              ? `"${str}"`
              : str;
          }).join(",")
        ),
      ].join("\n");

      // 다운로드
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const todayStr = today.toISOString().split("T")[0];
      
      const typeLabels: Record<ExportType, string> = {
        all: "전체",
        pending: "승인대기",
        approved: "승인완료",
        today: "오늘",
        week: "이번주",
      };
      
      link.href = url;
      link.download = `예약현황_${typeLabels[type]}_${todayStr}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert(`${reservations.length}건의 예약이 내보내기 되었습니다.`);
    } catch (err) {
      console.error(err);
      alert("내보내기 중 오류가 발생했습니다.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={isExporting}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 16px",
          background: "var(--card-bg, #1a1a1a)",
          borderRadius: 10,
          border: "1px solid #22c55e",
          color: "#22c55e",
          cursor: isExporting ? "not-allowed" : "pointer",
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        <span>📊</span>
        {isExporting ? "내보내는 중..." : "엑셀 내보내기"}
        <span style={{ marginLeft: 4 }}>▼</span>
      </button>

      {showMenu && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 99 }}
            onClick={() => setShowMenu(false)}
          />
          <div
            style={{
              position: "absolute",
              top: "100%",
              right: 0,
              marginTop: 8,
              background: "var(--card-bg, #1a1a1a)",
              border: "1px solid var(--border-color, #333)",
              borderRadius: 10,
              overflow: "hidden",
              zIndex: 100,
              minWidth: 180,
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            }}
          >
            <button onClick={() => handleExport("all")} style={menuItemStyle}>
              📋 전체 예약
            </button>
            <button onClick={() => handleExport("pending")} style={menuItemStyle}>
              ⏳ 승인대기
            </button>
            <button onClick={() => handleExport("approved")} style={menuItemStyle}>
              ✅ 승인완료
            </button>
            <button onClick={() => handleExport("today")} style={menuItemStyle}>
              📅 오늘 예약
            </button>
            <button onClick={() => handleExport("week")} style={menuItemStyle}>
              📆 이번 주 예약
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const menuItemStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "12px 16px",
  background: "transparent",
  border: "none",
  borderBottom: "1px solid var(--border-color, #222)",
  color: "var(--foreground, white)",
  textAlign: "left",
  cursor: "pointer",
  fontSize: 14,
};
