"use client";

import { useEffect, useState } from "react";

type Reservation = {
  id: string;
  facility_id: string;
  start_at: string;
  end_at: string;
  status: string;
  purpose: string;
  attendees: number;
  applicant_name: string;
  booker_name?: string;
  applicant_phone: string;
  booker_phone?: string;
  applicant_email: string | null;
  applicant_dept: string | null;
  notes: string | null;
  admin_memo: string | null;
  checked_in_at: string | null;
  created_at: string;
  rental_amount?: number;
  facility?: {
    id: string;
    name: string;
    location: string | null;
  };
};

const statusLabels: Record<string, string> = {
  pending: "승인대기",
  approved: "승인됨",
  rejected: "거절됨",
  cancelled: "취소됨",
  expired: "사용완료",
};

const statusColors: Record<string, string> = {
  pending: "#eab308",
  approved: "#22c55e",
  rejected: "#ef4444",
  cancelled: "#6b7280",
  expired: "#8b5cf6",
};

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [viewMode, setViewMode] = useState<"active" | "archive">("active"); // 활성/보관함
  const [sortBy, setSortBy] = useState<"date" | "facility">("date"); // 정렬 기준
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc"); // 정렬 순서
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [adminMemo, setAdminMemo] = useState("");
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendTime, setExtendTime] = useState("");
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyDate, setCopyDate] = useState("");
  
  // 체크박스 선택 상태
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  
  // 수정 모달 상태
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    startAt: "",
    endAt: "",
    purpose: "",
    attendees: 1,
    applicantName: "",
    applicantPhone: "",
    applicantEmail: "",
    applicantDept: "",
    notes: "",
    status: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  // 만료 여부 체크 함수
  const isExpired = (r: Reservation): boolean => {
    if (r.status === "rejected" || r.status === "cancelled") return false;
    const endAt = parseLocalDate(r.end_at);
    return endAt < new Date();
  };

  // 로컬 시간 파싱
  const parseLocalDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    if (!dateStr.includes("Z") && !dateStr.includes("+")) {
      const [datePart, timePart] = dateStr.split("T");
      if (!datePart || !timePart) return new Date(dateStr);
      const [year, month, day] = datePart.split("-").map(Number);
      const [hour, minute] = timePart.split(":").map(Number);
      return new Date(year, month - 1, day, hour, minute);
    }
    return new Date(dateStr);
  };

  // 표시용 상태 (만료 체크 포함)
  const getDisplayStatus = (r: Reservation): string => {
    if (isExpired(r) && (r.status === "approved" || r.status === "pending")) {
      return "expired";
    }
    return r.status;
  };

  // 필터링된 예약 목록 (활성/보관함)
  const filteredReservations = reservations.filter((r) => {
    const displayStatus = getDisplayStatus(r);
    if (viewMode === "archive") {
      // 보관함: 만료됨, 거절됨, 취소됨
      return displayStatus === "expired" || r.status === "rejected" || r.status === "cancelled";
    } else {
      // 활성: 승인대기, 승인됨 (만료되지 않은)
      return displayStatus === "pending" || displayStatus === "approved";
    }
  });

  // 정렬된 예약 목록
  const sortedReservations = [...filteredReservations].sort((a, b) => {
    if (sortBy === "facility") {
      // 시설명으로 1차 정렬
      const facilityA = a.facility?.name || "";
      const facilityB = b.facility?.name || "";
      const facilityCompare = facilityA.localeCompare(facilityB, "ko");
      if (facilityCompare !== 0) {
        return sortOrder === "asc" ? facilityCompare : -facilityCompare;
      }
      // 같은 시설이면 날짜순 (항상 오름차순)
      return parseLocalDate(a.start_at).getTime() - parseLocalDate(b.start_at).getTime();
    } else {
      // 날짜순 정렬
      const dateA = parseLocalDate(a.start_at).getTime();
      const dateB = parseLocalDate(b.start_at).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    }
  });

  const fetchReservations = async () => {
    setLoading(true);
    setSelectedIds(new Set()); // 검색 시 선택 초기화
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.append("status", filter);
      if (search) params.append("search", search);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);

      const res = await fetch(`/api/reservations?${params}`);
      const json = await res.json();
      if (json.ok) {
        setReservations(json.reservations || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [filter]);

  const handleSearch = () => {
    fetchReservations();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말로 이 예약을 삭제하시겠습니까? 이 작업은 취소할 수 없습니다.")) return;

    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.ok) {
        alert("예약이 삭제되었습니다.");
        fetchReservations();
        setSelectedReservation(null);
      } else {
        alert("삭제 실패: " + json.message);
      }
    } catch (err) {
      console.error(err);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const handleStatusChange = async (id: string, status: string, reason?: string) => {
    try {
      const res = await fetch(`/api/reservations/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reason }),
      });
      const json = await res.json();
      if (json.ok) {
        fetchReservations();
        setSelectedReservation(null);
        setAdminMemo("");
      } else {
        alert(json.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExtend = async () => {
    if (!selectedReservation || !extendTime) return;

    try {
      const endDate = selectedReservation.end_at.split("T")[0];
      const newEndAt = `${endDate}T${extendTime}:00`;

      const res = await fetch(`/api/reservations/${selectedReservation.id}/extend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_end_at: newEndAt }),
      });
      const json = await res.json();
      if (json.ok) {
        alert("예약이 연장되었습니다.");
        fetchReservations();
        setShowExtendModal(false);
        setSelectedReservation(null);
      } else {
        alert(json.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopy = async () => {
    if (!selectedReservation || !copyDate) return;

    try {
      // 타임존 정보 제거 후 순수 시간만 추출 (예: "10:00:00+09:00" -> "10:00")
      const extractTime = (dateStr: string) => {
        const timePart = dateStr.split("T")[1] || "";
        // "+09:00" 또는 "Z" 제거 후 HH:mm만 추출
        return timePart.replace(/[+-]\d{2}:\d{2}$/, "").replace(/Z$/, "").slice(0, 5);
      };
      const startTime = extractTime(selectedReservation.start_at);
      const endTime = extractTime(selectedReservation.end_at);
      const newStartAt = `${copyDate}T${startTime}`;
      const newEndAt = `${copyDate}T${endTime}`;

      const res = await fetch(`/api/reservations/${selectedReservation.id}/copy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start_at: newStartAt, end_at: newEndAt }),
      });
      const json = await res.json();
      if (json.ok) {
        alert("예약이 복사되었습니다.");
        fetchReservations();
        setShowCopyModal(false);
        setSelectedReservation(null);
      } else {
        alert(json.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 로컬 시간 문자열을 올바르게 파싱
  const formatDate = (dateStr: string) => {
    // "2026-02-24T10:00" 형식 -> 로컬 시간으로 파싱
    if (!dateStr) return "-";
    
    // UTC 형식(Z 또는 +포함)이 아니면 로컬 시간으로 직접 파싱
    if (!dateStr.includes("Z") && !dateStr.includes("+")) {
      const [datePart, timePart] = dateStr.split("T");
      if (!datePart || !timePart) return dateStr;
      
      const [year, month, day] = datePart.split("-").map(Number);
      const [hour, minute] = timePart.split(":").map(Number);
      
      const date = new Date(year, month - 1, day, hour, minute);
      return date.toLocaleString("ko-KR", {
        month: "short",
        day: "numeric",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    
    // UTC 형식이면 그대로 변환
    return new Date(dateStr).toLocaleString("ko-KR", {
      month: "short",
      day: "numeric",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getName = (r: Reservation) => r.applicant_name || r.booker_name || "-";
  const getPhone = (r: Reservation) => r.applicant_phone || r.booker_phone || "-";

  // 체크박스 토글
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedIds.size === sortedReservations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedReservations.map((r) => r.id)));
    }
  };

  // 일괄 삭제
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      alert("삭제할 예약을 선택해주세요.");
      return;
    }

    if (!confirm(`선택한 ${selectedIds.size}개의 예약을 삭제하시겠습니까?\n이 작업은 취소할 수 없습니다.`)) {
      return;
    }

    setIsDeleting(true);
    let successCount = 0;
    let failCount = 0;

    for (const id of selectedIds) {
      try {
        const res = await fetch(`/api/reservations/${id}`, { method: "DELETE" });
        const json = await res.json();
        if (json.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    setIsDeleting(false);
    setSelectedIds(new Set());
    fetchReservations();

    if (failCount === 0) {
      alert(`${successCount}개의 예약이 삭제되었습니다.`);
    } else {
      alert(`${successCount}개 삭제 성공, ${failCount}개 삭제 실패`);
    }
  };

  // 선택된 예약 중 승인대기 상태인 예약 수
  const pendingSelectedCount = Array.from(selectedIds).filter((id) => {
    const r = reservations.find((res) => res.id === id);
    return r && r.status === "pending" && !isExpired(r);
  }).length;

  // 일괄 승인
  const handleBulkApprove = async () => {
    const pendingIds = Array.from(selectedIds).filter((id) => {
      const r = reservations.find((res) => res.id === id);
      return r && r.status === "pending" && !isExpired(r);
    });

    if (pendingIds.length === 0) {
      alert("승인할 수 있는 예약이 없습니다. (승인대기 상태인 예약만 승인 가능)");
      return;
    }

    if (!confirm(`선택한 ${pendingIds.length}개의 예약을 일괄 승인하시겠습니까?`)) {
      return;
    }

    setIsBulkProcessing(true);
    let successCount = 0;
    let failCount = 0;

    for (const id of pendingIds) {
      try {
        const res = await fetch(`/api/reservations/${id}/status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "approved" }),
        });
        const json = await res.json();
        if (json.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    setIsBulkProcessing(false);
    setSelectedIds(new Set());
    fetchReservations();

    if (failCount === 0) {
      alert(`${successCount}개의 예약이 승인되었습니다.`);
    } else {
      alert(`${successCount}개 승인 성공, ${failCount}개 승인 실패`);
    }
  };

  // 일괄 거절
  const handleBulkReject = async () => {
    const pendingIds = Array.from(selectedIds).filter((id) => {
      const r = reservations.find((res) => res.id === id);
      return r && r.status === "pending" && !isExpired(r);
    });

    if (pendingIds.length === 0) {
      alert("거절할 수 있는 예약이 없습니다. (승인대기 상태인 예약만 거절 가능)");
      return;
    }

    const reason = prompt(`선택한 ${pendingIds.length}개의 예약을 일괄 거절합니다.\n거절 사유를 입력하세요:`);
    if (reason === null) return;

    setIsBulkProcessing(true);
    let successCount = 0;
    let failCount = 0;

    for (const id of pendingIds) {
      try {
        const res = await fetch(`/api/reservations/${id}/status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "rejected", reason }),
        });
        const json = await res.json();
        if (json.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    setIsBulkProcessing(false);
    setSelectedIds(new Set());
    fetchReservations();

    if (failCount === 0) {
      alert(`${successCount}개의 예약이 거절되었습니다.`);
    } else {
      alert(`${successCount}개 거절 성공, ${failCount}개 거절 실패`);
    }
  };

  // 엑셀 내보내기
  const handleExportExcel = () => {
    const dataToExport = selectedIds.size > 0
      ? reservations.filter((r) => selectedIds.has(r.id))
      : reservations;

    if (dataToExport.length === 0) {
      alert("내보낼 데이터가 없습니다.");
      return;
    }

    // 날짜 포맷 함수
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

    // CSV 헤더
    const headers = [
      "예약번호",
      "시설명",
      "상태",
      "시작일시",
      "종료일시",
      "신청자",
      "연락처",
      "이메일",
      "소속",
      "사용목적",
      "인원",
      "비고",
      "체크인시간",
      "신청일",
    ];

    // CSV 데이터
    const rows = dataToExport.map((r) => [
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

    // BOM + CSV 생성
    const BOM = "\uFEFF";
    const csvContent = BOM + [
      headers.join(","),
      ...rows.map((row) =>
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
    const today = new Date().toISOString().split("T")[0];
    link.href = url;
    link.download = `예약현황_${today}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert(`${dataToExport.length}건의 예약이 내보내기 되었습니다.`);
  };

  // 수정 모달 열기
  const openEditModal = (r: Reservation) => {
    setSelectedReservation(r);
    
    // datetime-local 형식으로 변환
    const formatForInput = (dateStr: string) => {
      if (!dateStr) return "";
      if (dateStr.includes("Z") || dateStr.includes("+")) {
        const d = new Date(dateStr);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const hour = String(d.getHours()).padStart(2, "0");
        const minute = String(d.getMinutes()).padStart(2, "0");
        return `${year}-${month}-${day}T${hour}:${minute}`;
      }
      return dateStr.slice(0, 16); // "YYYY-MM-DDTHH:mm"
    };

    setEditForm({
      startAt: formatForInput(r.start_at),
      endAt: formatForInput(r.end_at),
      purpose: r.purpose || "",
      attendees: r.attendees || 1,
      applicantName: r.applicant_name || r.booker_name || "",
      applicantPhone: r.applicant_phone || r.booker_phone || "",
      applicantEmail: r.applicant_email || "",
      applicantDept: r.applicant_dept || "",
      notes: r.notes || "",
      status: r.status,
    });
    setShowEditModal(true);
  };

  // 수정 저장
  const handleSaveEdit = async () => {
    if (!selectedReservation) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/reservations/${selectedReservation.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_at: editForm.startAt + ":00+09:00",
          end_at: editForm.endAt + ":00+09:00",
          purpose: editForm.purpose,
          attendees: editForm.attendees,
          applicant_name: editForm.applicantName,
          applicant_phone: editForm.applicantPhone,
          applicant_email: editForm.applicantEmail || null,
          applicant_dept: editForm.applicantDept || null,
          notes: editForm.notes || null,
          status: editForm.status,
        }),
      });

      const json = await res.json();
      if (json.ok) {
        alert("예약이 수정되었습니다.");
        fetchReservations();
        setShowEditModal(false);
        setSelectedReservation(null);
      } else {
        alert("수정 실패: " + json.message);
      }
    } catch (err) {
      console.error(err);
      alert("수정 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>예약 관리</h1>

      {/* 활성/보관함 탭 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setViewMode("active")}
          style={{
            padding: "10px 20px",
            borderRadius: 8,
            border: "none",
            background: viewMode === "active" ? "#3b82f6" : "#1a1a1a",
            color: viewMode === "active" ? "white" : "#888",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          📋 진행중 예약
        </button>
        <button
          onClick={() => setViewMode("archive")}
          style={{
            padding: "10px 20px",
            borderRadius: 8,
            border: "none",
            background: viewMode === "archive" ? "#8b5cf6" : "#1a1a1a",
            color: viewMode === "archive" ? "white" : "#888",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          📦 보관함 (완료/취소/거절)
        </button>
      </div>

      {/* 검색 및 필터 */}
      <div style={{
        display: "flex",
        gap: 12,
        marginBottom: 24,
        flexWrap: "wrap",
        alignItems: "flex-end",
      }}>
        <div>
          <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 4 }}>검색</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름 또는 연락처"
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #333",
              background: "#1a1a1a",
              color: "white",
              width: 160,
            }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 4 }}>시작일</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #333",
              background: "#1a1a1a",
              color: "white",
            }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 4 }}>종료일</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: "1px solid #333",
              background: "#1a1a1a",
              color: "white",
            }}
          />
        </div>
        <button
          onClick={handleSearch}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            background: "var(--color-primary, #3b82f6)",
            color: "white",
            cursor: "pointer",
          }}
        >
          검색
        </button>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #333",
            background: "#1a1a1a",
            color: "white",
          }}
        >
          <option value="all">전체</option>
          <option value="pending">승인대기</option>
          <option value="approved">승인됨</option>
          <option value="rejected">거절됨</option>
          <option value="cancelled">취소됨</option>
          <option value="expired">사용완료</option>
        </select>

        {/* 일괄 승인/거절/삭제 버튼 */}
        {selectedIds.size > 0 && (
          <>
            {pendingSelectedCount > 0 && (
              <>
                <button
                  onClick={handleBulkApprove}
                  disabled={isBulkProcessing}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "none",
                    background: "#22c55e",
                    color: "white",
                    cursor: isBulkProcessing ? "not-allowed" : "pointer",
                    fontWeight: 600,
                    opacity: isBulkProcessing ? 0.6 : 1,
                  }}
                >
                  {isBulkProcessing ? "처리 중..." : `✅ 일괄승인 (${pendingSelectedCount})`}
                </button>
                <button
                  onClick={handleBulkReject}
                  disabled={isBulkProcessing}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "1px solid #ef4444",
                    background: "#ef444422",
                    color: "#ef4444",
                    cursor: isBulkProcessing ? "not-allowed" : "pointer",
                    fontWeight: 600,
                    opacity: isBulkProcessing ? 0.6 : 1,
                  }}
                >
                  {isBulkProcessing ? "처리 중..." : `❌ 일괄거절 (${pendingSelectedCount})`}
                </button>
              </>
            )}
            <button
              onClick={handleBulkDelete}
              disabled={isDeleting}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                background: "#dc2626",
                color: "white",
                cursor: isDeleting ? "not-allowed" : "pointer",
                fontWeight: 600,
                opacity: isDeleting ? 0.6 : 1,
              }}
            >
              {isDeleting ? "삭제 중..." : `🗑️ 선택삭제 (${selectedIds.size})`}
            </button>
          </>
        )}

        {/* 엑셀 내보내기 버튼 */}
        <button
          onClick={handleExportExcel}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid #22c55e",
            background: "#22c55e22",
            color: "#22c55e",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          📊 엑셀 내보내기 {selectedIds.size > 0 ? `(${selectedIds.size})` : `(${sortedReservations.length})`}
        </button>

        {/* 정렬 버튼 */}
        <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
          <button
            onClick={() => {
              if (sortBy === "date") {
                setSortOrder(sortOrder === "asc" ? "desc" : "asc");
              } else {
                setSortBy("date");
                setSortOrder("asc");
              }
            }}
            style={{
              padding: "8px 12px",
              borderRadius: "8px 0 0 8px",
              border: sortBy === "date" ? "1px solid #3b82f6" : "1px solid #333",
              background: sortBy === "date" ? "#3b82f622" : "#1a1a1a",
              color: sortBy === "date" ? "#3b82f6" : "#888",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            📅 날짜순 {sortBy === "date" && (sortOrder === "asc" ? "↑" : "↓")}
          </button>
          <button
            onClick={() => {
              if (sortBy === "facility") {
                setSortOrder(sortOrder === "asc" ? "desc" : "asc");
              } else {
                setSortBy("facility");
                setSortOrder("asc");
              }
            }}
            style={{
              padding: "8px 12px",
              borderRadius: "0 8px 8px 0",
              border: sortBy === "facility" ? "1px solid #3b82f6" : "1px solid #333",
              background: sortBy === "facility" ? "#3b82f622" : "#1a1a1a",
              color: sortBy === "facility" ? "#3b82f6" : "#888",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            🏢 호실별 {sortBy === "facility" && (sortOrder === "asc" ? "↑" : "↓")}
          </button>
        </div>
      </div>

      {/* 예약 목록 */}
      {loading ? (
        <div style={{ color: "#888", padding: 40, textAlign: "center" }}>로딩 중...</div>
      ) : sortedReservations.length === 0 ? (
        <div style={{ padding: 40, background: "#1a1a1a", borderRadius: 12, textAlign: "center", color: "#888" }}>
          {viewMode === "archive" ? "보관함이 비어있습니다." : "진행중인 예약이 없습니다."}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {/* 전체 선택 헤더 */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "8px 16px",
            background: "#111",
            borderRadius: 8,
          }}>
            <input
              type="checkbox"
              checked={selectedIds.size === sortedReservations.length && sortedReservations.length > 0}
              onChange={toggleSelectAll}
              style={{ width: 18, height: 18, cursor: "pointer" }}
            />
            <span style={{ color: "#888", fontSize: 13 }}>
              전체 선택 ({selectedIds.size}/{sortedReservations.length})
            </span>
          </div>

          {sortedReservations.map((r) => {
            const displayStatus = getDisplayStatus(r);
            return (
            <div
              key={r.id}
              style={{
                background: selectedIds.has(r.id) ? "#1f2937" : "#1a1a1a",
                borderRadius: 12,
                padding: 16,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
                borderLeft: `4px solid ${statusColors[displayStatus] || statusColors[r.status]}`,
                transition: "background 0.2s",
              }}
            >
              {/* 체크박스 */}
              <input
                type="checkbox"
                checked={selectedIds.has(r.id)}
                onChange={() => toggleSelect(r.id)}
                style={{ width: 18, height: 18, cursor: "pointer", flexShrink: 0 }}
              />

              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{r.facility?.name || "시설"}</span>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 999,
                      fontSize: 11,
                      background: `${statusColors[displayStatus]}22`,
                      color: statusColors[displayStatus],
                    }}
                  >
                    {statusLabels[displayStatus]}
                  </span>
                  {r.checked_in_at && (
                    <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, background: "#22c55e22", color: "#22c55e" }}>
                      체크인완료
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: "#888" }}>
                  {formatDate(r.start_at)} ~ {formatDate(r.end_at)}
                </div>
                <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>
                  {getName(r)} · {getPhone(r)} · {r.purpose || "-"}
                </div>
                <div style={{ fontSize: 13, color: "#38bdf8", marginTop: 4, fontWeight: 700 }}>
                  사용료 {(r.rental_amount || 0).toLocaleString("ko-KR")}원
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {r.status === "pending" && displayStatus !== "expired" && (
                  <>
                    <button
                      onClick={() => handleStatusChange(r.id, "approved")}
                      style={{ padding: "6px 12px", borderRadius: 6, border: "none", background: "#22c55e", color: "white", cursor: "pointer", fontSize: 12 }}
                    >
                      승인
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt("거절 사유를 입력하세요:");
                        if (reason !== null) {
                          handleStatusChange(r.id, "rejected", reason);
                        }
                      }}
                      style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #ef4444", background: "transparent", color: "#ef4444", cursor: "pointer", fontSize: 12 }}
                    >
                      거절
                    </button>
                  </>
                )}
                {r.status === "approved" && (
                  <>
                    <button onClick={() => { setSelectedReservation(r); setExtendTime(r.end_at.split("T")[1].slice(0, 5)); setShowExtendModal(true); }} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #3b82f6", background: "transparent", color: "#3b82f6", cursor: "pointer", fontSize: 12 }}>연장</button>
                    <a href={`/api/reservations/${r.id}/receipt`} target="_blank" rel="noopener noreferrer" style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #22c55e", background: "#22c55e22", color: "#22c55e", cursor: "pointer", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>🧾 영수증</a>
                  </>
                )}
                <button
                  onClick={() => {
                    setSelectedReservation(r);
                    setCopyDate(r.start_at.split("T")[0]);
                    setShowCopyModal(true);
                  }}
                  style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #888", background: "transparent", color: "#888", cursor: "pointer", fontSize: 12 }}
                >
                  복사
                </button>
                <button
                  onClick={() => openEditModal(r)}
                  style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #3b82f6", background: "#3b82f622", color: "#3b82f6", cursor: "pointer", fontSize: 12 }}
                >
                  ✏️ 수정
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #dc2626", background: "#dc262622", color: "#dc2626", cursor: "pointer", fontSize: 12 }}
                >
                  🗑️ 삭제
                </button>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* 수정 모달 */}
      {showEditModal && selectedReservation && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            style={{ background: "#1a1a1a", borderRadius: 16, padding: 24, width: "100%", maxWidth: 500, maxHeight: "90vh", overflow: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>예약 수정</h2>
            <p style={{ color: "#888", fontSize: 13, marginBottom: 16 }}>
              {selectedReservation.facility?.name} · 예약번호: {selectedReservation.id.slice(0, 8).toUpperCase()}
            </p>
            
            {/* 시작/종료 시간 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "#aaa" }}>시작 일시</label>
                <input
                  type="datetime-local"
                  value={editForm.startAt}
                  onChange={(e) => setEditForm({ ...editForm, startAt: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "#aaa" }}>종료 일시</label>
                <input
                  type="datetime-local"
                  value={editForm.endAt}
                  onChange={(e) => setEditForm({ ...editForm, endAt: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* 상태 */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "#aaa" }}>상태</label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                style={inputStyle}
              >
                <option value="pending">승인대기</option>
                <option value="approved">승인됨</option>
                <option value="rejected">거절됨</option>
                <option value="cancelled">취소됨</option>
              </select>
            </div>

            {/* 신청자 정보 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "#aaa" }}>신청자 이름</label>
                <input
                  type="text"
                  value={editForm.applicantName}
                  onChange={(e) => setEditForm({ ...editForm, applicantName: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "#aaa" }}>연락처</label>
                <input
                  type="tel"
                  value={editForm.applicantPhone}
                  onChange={(e) => setEditForm({ ...editForm, applicantPhone: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "#aaa" }}>이메일</label>
                <input
                  type="email"
                  value={editForm.applicantEmail}
                  onChange={(e) => setEditForm({ ...editForm, applicantEmail: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "#aaa" }}>소속/부서</label>
                <input
                  type="text"
                  value={editForm.applicantDept}
                  onChange={(e) => setEditForm({ ...editForm, applicantDept: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* 사용 목적 & 인원 */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "#aaa" }}>사용 목적</label>
                <input
                  type="text"
                  value={editForm.purpose}
                  onChange={(e) => setEditForm({ ...editForm, purpose: e.target.value })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "#aaa" }}>인원</label>
                <input
                  type="number"
                  min={1}
                  value={editForm.attendees}
                  onChange={(e) => setEditForm({ ...editForm, attendees: parseInt(e.target.value) || 1 })}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* 비고 */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: "#aaa" }}>비고</label>
              <textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>

            {/* 버튼 */}
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setShowEditModal(false)}
                style={{ flex: 1, padding: 12, borderRadius: 10, border: "1px solid #444", background: "transparent", color: "#aaa", cursor: "pointer" }}
              >
                취소
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 10,
                  border: "none",
                  background: isSaving ? "#444" : "#3b82f6",
                  color: "white",
                  cursor: isSaving ? "not-allowed" : "pointer",
                  fontWeight: 600,
                }}
              >
                {isSaving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 연장 모달 */}
      {showExtendModal && selectedReservation && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={() => setShowExtendModal(false)}
        >
          <div
            style={{ background: "#1a1a1a", borderRadius: 16, padding: 24, width: "100%", maxWidth: 400 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>예약 연장</h2>
            <p style={{ color: "#888", fontSize: 14, marginBottom: 16 }}>
              {selectedReservation.facility?.name}<br />
              현재 종료: {formatDate(selectedReservation.end_at)}
            </p>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "#aaa" }}>새 종료 시간</label>
              <input
                type="time"
                value={extendTime}
                onChange={(e) => setExtendTime(e.target.value)}
                style={{ width: "100%", padding: "12px", borderRadius: 8, border: "1px solid #333", background: "#0f0f0f", color: "white" }}
              />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setShowExtendModal(false)} style={{ flex: 1, padding: 12, borderRadius: 10, border: "1px solid #444", background: "transparent", color: "#aaa", cursor: "pointer" }}>
                취소
              </button>
              <button onClick={handleExtend} style={{ flex: 1, padding: 12, borderRadius: 10, border: "none", background: "var(--color-primary, #3b82f6)", color: "white", cursor: "pointer", fontWeight: 600 }}>
                연장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 복사 모달 */}
      {showCopyModal && selectedReservation && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={() => setShowCopyModal(false)}
        >
          <div
            style={{ background: "#1a1a1a", borderRadius: 16, padding: 24, width: "100%", maxWidth: 400 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>예약 복사</h2>
            <p style={{ color: "#888", fontSize: 14, marginBottom: 16 }}>
              {selectedReservation.facility?.name}<br />
              원본: {formatDate(selectedReservation.start_at)} ~ {formatDate(selectedReservation.end_at)}
            </p>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "#aaa" }}>새 예약 날짜</label>
              <input
                type="date"
                value={copyDate}
                onChange={(e) => setCopyDate(e.target.value)}
                style={{ width: "100%", padding: "12px", borderRadius: 8, border: "1px solid #333", background: "#0f0f0f", color: "white" }}
              />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setShowCopyModal(false)} style={{ flex: 1, padding: 12, borderRadius: 10, border: "1px solid #444", background: "transparent", color: "#aaa", cursor: "pointer" }}>
                취소
              </button>
              <button onClick={handleCopy} style={{ flex: 1, padding: 12, borderRadius: 10, border: "none", background: "var(--color-primary, #3b82f6)", color: "white", cursor: "pointer", fontWeight: 600 }}>
                복사
              </button>
            </div>
          </div>
        </div>
      )}
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
