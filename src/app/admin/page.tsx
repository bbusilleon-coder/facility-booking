import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";

type Stats = {
  totalFacilities: number;
  activeFacilities: number;
  totalReservations: number;
  pendingReservations: number;
  approvedReservations: number;
  todayReservations: number;
  weekReservations: number;
};

async function getStats(): Promise<Stats> {
  const supabase = createServerClient();
  
  // 시설물 통계
  const { count: totalFacilities } = await supabase
    .from("facilities")
    .select("*", { count: "exact", head: true });

  const { count: activeFacilities } = await supabase
    .from("facilities")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  // 예약 통계
  const { count: totalReservations } = await supabase
    .from("reservations")
    .select("*", { count: "exact", head: true });

  const { count: pendingReservations } = await supabase
    .from("reservations")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  const { count: approvedReservations } = await supabase
    .from("reservations")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved");

  // 오늘 예약
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

  const { count: todayReservations } = await supabase
    .from("reservations")
    .select("*", { count: "exact", head: true })
    .gte("start_at", todayStart)
    .lt("start_at", todayEnd)
    .in("status", ["pending", "approved"]);

  // 이번 주 예약
  const dayOfWeek = today.getDay();
  const weekStart = new Date(today.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

  const { count: weekReservations } = await supabase
    .from("reservations")
    .select("*", { count: "exact", head: true })
    .gte("start_at", weekStart.toISOString())
    .lt("start_at", weekEnd.toISOString())
    .in("status", ["pending", "approved"]);

  return {
    totalFacilities: totalFacilities || 0,
    activeFacilities: activeFacilities || 0,
    totalReservations: totalReservations || 0,
    pendingReservations: pendingReservations || 0,
    approvedReservations: approvedReservations || 0,
    todayReservations: todayReservations || 0,
    weekReservations: weekReservations || 0,
  };
}

type RecentReservation = {
  id: string;
  status: string;
  purpose: string;
  applicant_name: string;
  applicant_phone: string;
  start_at: string;
  created_at: string;
  facility?: { name: string } | null;
};

async function getRecentReservations(): Promise<RecentReservation[]> {
  const supabase = createServerClient();
  
  const { data } = await supabase
    .from("reservations")
    .select(`
      id, status, purpose, applicant_name, applicant_phone, start_at, created_at,
      facility:facilities(name)
    `)
    .order("created_at", { ascending: false })
    .limit(10);

  if (!data) return [];

  // Supabase join 결과를 변환 (배열 -> 단일 객체)
  return data.map((item: any) => ({
    ...item,
    facility: Array.isArray(item.facility) ? item.facility[0] : item.facility,
  }));
}

const statusLabels: Record<string, string> = {
  pending: "승인대기",
  approved: "승인됨",
  rejected: "거절됨",
  cancelled: "취소됨",
};

const statusColors: Record<string, string> = {
  pending: "#eab308",
  approved: "#22c55e",
  rejected: "#ef4444",
  cancelled: "#6b7280",
};

export default async function AdminDashboard() {
  const stats = await getStats();
  const recentReservations = await getRecentReservations();

  const statCards = [
    { label: "전체 시설물", value: stats.totalFacilities, color: "#3b82f6", icon: "🏢" },
    { label: "활성 시설물", value: stats.activeFacilities, color: "#22c55e", icon: "✅" },
    { label: "승인 대기", value: stats.pendingReservations, color: "#eab308", icon: "⏳", link: "/admin/reservations?status=pending" },
    { label: "오늘 예약", value: stats.todayReservations, color: "#8b5cf6", icon: "📅" },
    { label: "이번 주 예약", value: stats.weekReservations, color: "#06b6d4", icon: "📆" },
    { label: "전체 예약", value: stats.totalReservations, color: "#6b7280", icon: "📊" },
  ];

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>대시보드</h1>

      {/* 통계 카드 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 32 }}>
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.link || "#"}
            style={{
              background: "#1a1a1a",
              borderRadius: 12,
              padding: 16,
              borderLeft: `4px solid ${card.color}`,
              textDecoration: "none",
              color: "inherit",
              transition: "transform 0.2s",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ color: "#888", fontSize: 12, marginBottom: 4 }}>{card.label}</div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{card.value}</div>
              </div>
              <span style={{ fontSize: 20 }}>{card.icon}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* 빠른 작업 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 32 }}>
        <Link
          href="/admin/facilities/new"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: 16,
            background: "#1a1a1a",
            borderRadius: 12,
            textDecoration: "none",
            color: "white",
            border: "1px dashed #333",
          }}
        >
          <span style={{ fontSize: 24 }}>➕</span>
          <div>
            <div style={{ fontWeight: 600 }}>시설물 등록</div>
            <div style={{ fontSize: 12, color: "#888" }}>새 시설물 추가</div>
          </div>
        </Link>
        
        <Link
          href="/admin/reservations"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: 16,
            background: "#1a1a1a",
            borderRadius: 12,
            textDecoration: "none",
            color: "white",
            border: "1px dashed #333",
          }}
        >
          <span style={{ fontSize: 24 }}>📋</span>
          <div>
            <div style={{ fontWeight: 600 }}>예약 관리</div>
            <div style={{ fontSize: 12, color: "#888" }}>승인/거절 처리</div>
          </div>
        </Link>
        
        <Link
          href="/admin/calendar"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: 16,
            background: "#1a1a1a",
            borderRadius: 12,
            textDecoration: "none",
            color: "white",
            border: "1px dashed #333",
          }}
        >
          <span style={{ fontSize: 24 }}>📆</span>
          <div>
            <div style={{ fontWeight: 600 }}>전체 현황</div>
            <div style={{ fontSize: 12, color: "#888" }}>캘린더 보기</div>
          </div>
        </Link>
      </div>

      {/* 최근 예약 */}
      <div style={{ background: "#1a1a1a", borderRadius: 12, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>최근 예약 신청</h2>
          <Link href="/admin/reservations" style={{ color: "#3b82f6", fontSize: 13 }}>
            전체 보기 →
          </Link>
        </div>
        
        {recentReservations.length === 0 ? (
          <div style={{ color: "#888", padding: 20, textAlign: "center" }}>
            예약 내역이 없습니다.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #333" }}>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: "#888", fontSize: 13 }}>시설물</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: "#888", fontSize: 13 }}>목적</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: "#888", fontSize: 13 }}>신청자</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: "#888", fontSize: 13 }}>예약일시</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", color: "#888", fontSize: 13 }}>상태</th>
                </tr>
              </thead>
              <tbody>
                {recentReservations.map((r) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #222" }}>
                    <td style={{ padding: "12px", fontWeight: 500 }}>{r.facility?.name || "-"}</td>
                    <td style={{ padding: "12px", color: "#ccc" }}>{r.purpose}</td>
                    <td style={{ padding: "12px" }}>
                      <div>{r.applicant_name}</div>
                      <div style={{ fontSize: 12, color: "#888" }}>{r.applicant_phone}</div>
                    </td>
                    <td style={{ padding: "12px", color: "#888", fontSize: 13 }}>
                      {formatDate(r.start_at)}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: 999,
                          fontSize: 12,
                          background: statusColors[r.status] + "22",
                          color: statusColors[r.status],
                        }}
                      >
                        {statusLabels[r.status] || r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
