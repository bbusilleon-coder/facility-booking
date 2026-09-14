import { applySeniorFreeRental } from "@/lib/rental-fee";

const MARKER = "\n\n[[RESERVATION_META_V1]]";

export type ReservationMeta = {
  termsAgreed: boolean;
  privacyAgreed: boolean;
  agreedAt: string;
  calculatedAmount: number;
  baseHours: number;
  baseFee: number;
  overtimeHours: number;
  overtimeHourlyFee: number;
};

export function encodeReservationNotes(notes: string | null | undefined, meta: ReservationMeta) {
  const cleanNotes = (notes || "").trim();
  const encoded = Buffer.from(JSON.stringify(meta), "utf8").toString("base64url");
  return `${cleanNotes}${MARKER}${encoded}`;
}

export function decodeReservationNotes(value: string | null | undefined): {
  notes: string | null;
  meta: ReservationMeta | null;
} {
  if (!value || !value.includes(MARKER)) return { notes: value || null, meta: null };

  const [notes, encoded] = value.split(MARKER);
  try {
    return {
      notes: notes.trim() || null,
      meta: JSON.parse(Buffer.from(encoded.trim(), "base64url").toString("utf8")),
    };
  } catch {
    return { notes: notes.trim() || null, meta: null };
  }
}

export function withDecodedReservation<T extends {
  notes?: string | null;
  applicant_name?: string | null;
  applicant_dept?: string | null;
  facility?: { name?: string | null } | Array<{ name?: string | null }> | null;
}>(reservation: T) {
  const decoded = decodeReservationNotes(reservation.notes);
  const facility = Array.isArray(reservation.facility) ? reservation.facility[0] : reservation.facility;
  const amount = applySeniorFreeRental(decoded.meta?.calculatedAmount ?? 0, {
    facilityName: facility?.name,
    applicantName: reservation.applicant_name,
    applicantDept: reservation.applicant_dept,
  });
  return {
    ...reservation,
    notes: decoded.notes,
    rental_amount: amount,
    agreement: decoded.meta,
  };
}
