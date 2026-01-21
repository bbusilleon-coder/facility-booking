"use client";

import Link from "next/link";
import { Reservation } from "@/types";
import { ReservationStatusBadge } from "./ReservationStatusBadge";
import { formatDateTime, formatPhone } from "@/lib/utils";

interface ReservationTableProps {
  reservations: Reservation[];
  showFacility?: boolean;
  showActions?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  isAdmin?: boolean;
}

export function ReservationTable({
  reservations,
  showFacility = true,
  showActions = false,
  onApprove,
  onReject,
  isAdmin = false,
}: ReservationTableProps) {
  if (reservations.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        예약 내역이 없습니다.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">상태</th>
            {showFacility && (
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">시설물</th>
            )}
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">예약일시</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">신청자</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">연락처</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">목적</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">인원</th>
            {showActions && (
              <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">관리</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y">
          {reservations.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <ReservationStatusBadge status={r.status} />
              </td>
              {showFacility && (
                <td className="px-4 py-3 text-sm text-gray-900">
                  {r.facility?.name || "-"}
                </td>
              )}
              <td className="px-4 py-3">
                <div className="text-sm text-gray-900">{formatDateTime(r.start_at)}</div>
                <div className="text-xs text-gray-500">~ {formatDateTime(r.end_at)}</div>
              </td>
              <td className="px-4 py-3">
                <div className="text-sm text-gray-900">{r.applicant_name}</div>
                <div className="text-xs text-gray-500">{r.applicant_dept || "-"}</div>
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {formatPhone(r.applicant_phone)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">
                {r.purpose}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {r.attendees}명
              </td>
              {showActions && (
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <Link
                      href={isAdmin ? `/admin/reservations/${r.id}` : `/reservation/${r.id}`}
                      className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                    >
                      상세
                    </Link>
                    {r.status === "pending" && onApprove && onReject && (
                      <>
                        <button
                          onClick={() => onApprove(r.id)}
                          className="px-3 py-1 text-xs font-medium text-green-600 bg-green-50 rounded hover:bg-green-100"
                        >
                          승인
                        </button>
                        <button
                          onClick={() => onReject(r.id)}
                          className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100"
                        >
                          거절
                        </button>
                      </>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
