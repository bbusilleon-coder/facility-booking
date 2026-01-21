"use client";

type Props = {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
};

export default function Skeleton({ 
  width = "100%", 
  height = 20, 
  borderRadius = 8,
  style = {},
}: Props) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: "linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%)",
        backgroundSize: "200% 100%",
        animation: "skeleton-pulse 1.5s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

// 카드 스켈레톤
export function CardSkeleton() {
  return (
    <div style={{
      border: "1px solid #222",
      borderRadius: 14,
      padding: 16,
      background: "#0f0f0f",
    }}>
      <Skeleton height={24} width="60%" style={{ marginBottom: 12 }} />
      <Skeleton height={16} width="40%" style={{ marginBottom: 8 }} />
      <Skeleton height={16} width="80%" />
    </div>
  );
}

// 테이블 행 스켈레톤
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr style={{ borderBottom: "1px solid #222" }}>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} style={{ padding: "14px 16px" }}>
          <Skeleton height={16} width={i === 0 ? "80%" : "60%"} />
        </td>
      ))}
    </tr>
  );
}

// 통계 카드 스켈레톤
export function StatCardSkeleton() {
  return (
    <div style={{
      background: "#1a1a1a",
      borderRadius: 12,
      padding: 20,
      borderLeft: "4px solid #333",
    }}>
      <Skeleton height={14} width="50%" style={{ marginBottom: 12 }} />
      <Skeleton height={32} width="40%" />
    </div>
  );
}

// 시설물 목록 스켈레톤
export function FacilityListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

// 예약 목록 스켈레톤
export function ReservationListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            background: "#1a1a1a",
            borderRadius: 12,
            padding: 16,
            border: "1px solid #222",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
            <Skeleton height={20} width="40%" />
            <Skeleton height={24} width={80} borderRadius={999} />
          </div>
          <Skeleton height={14} width="70%" style={{ marginBottom: 8 }} />
          <Skeleton height={14} width="50%" />
        </div>
      ))}
    </div>
  );
}
