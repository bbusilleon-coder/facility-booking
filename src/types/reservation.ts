// 예약 상태
export type ReservationStatus = "pending" | "approved" | "rejected" | "cancelled";

// 예약 상태 라벨
export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  pending: "승인대기",
  approved: "승인됨",
  rejected: "거절됨",
  cancelled: "취소됨",
};

// 예약 상태별 색상
export const RESERVATION_STATUS_COLORS: Record<ReservationStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-600",
};

// 예약자 정보
export interface Applicant {
  name: string;
  phone: string;
  email: string;
  dept: string;
}

// 예약 타입
export interface Reservation {
  id: string;
  facility_id: string;
  start_at: string;
  end_at: string;
  status: ReservationStatus;
  purpose: string;
  attendees: number;
  applicant_name: string;
  applicant_phone: string;
  applicant_email: string;
  applicant_dept: string;
  notes: string | null;
  admin_memo: string | null;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  approved_by: string | null;
  // 조인된 시설물 정보 (선택)
  facility?: {
    id: string;
    name: string;
    location: string | null;
  };
}

// 예약 폼 데이터
export interface ReservationFormData {
  facility_id: string;
  start_at: string;
  end_at: string;
  purpose: string;
  attendees: number;
  applicant_name: string;
  applicant_phone: string;
  applicant_email: string;
  applicant_dept: string;
  notes: string;
}

// 예약 생성 요청
export type ReservationCreateInput = Omit<
  Reservation,
  "id" | "status" | "admin_memo" | "created_at" | "updated_at" | "approved_at" | "approved_by" | "facility"
>;

// 예약 수정 요청 (관리자용)
export interface ReservationUpdateInput {
  start_at?: string;
  end_at?: string;
  purpose?: string;
  attendees?: number;
  applicant_name?: string;
  applicant_phone?: string;
  applicant_email?: string;
  applicant_dept?: string;
  notes?: string;
  admin_memo?: string;
}

// 예약 상태 변경 요청
export interface ReservationStatusChangeInput {
  status: ReservationStatus;
  admin_memo?: string;
  approved_by?: string;
}
