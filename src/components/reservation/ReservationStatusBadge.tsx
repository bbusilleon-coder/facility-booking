"use client";

import { Badge } from "@/components/ui";
import { ReservationStatus, RESERVATION_STATUS_LABELS } from "@/types";

interface ReservationStatusBadgeProps {
  status: ReservationStatus;
}

const statusVariants: Record<ReservationStatus, "warning" | "success" | "danger" | "default"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
  cancelled: "default",
};

export function ReservationStatusBadge({ status }: ReservationStatusBadgeProps) {
  return (
    <Badge variant={statusVariants[status]}>
      {RESERVATION_STATUS_LABELS[status]}
    </Badge>
  );
}
