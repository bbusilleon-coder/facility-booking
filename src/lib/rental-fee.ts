export type RentalPricing = {
  baseHours: number;
  baseFee: number;
  overtimeHourlyFee: number;
};

type FacilityPricingSource = {
  name?: string | null;
  base_hours?: number | null;
  base_fee?: number | null;
  overtime_hourly_fee?: number | null;
  features?: Record<string, unknown> | null;
};

type SeniorFreeRentalSource = {
  facilityName?: string | null;
  applicantName?: string | null;
  applicantDept?: string | null;
};

export type FreeRentalSource = SeniorFreeRentalSource & {
  isAdminBooking?: boolean;
};

const DOCUMENT_RATES: Array<{ pattern: RegExp; pricing: RentalPricing }> = [
  { pattern: /20[23]호/, pricing: { baseHours: 4, baseFee: 99_000, overtimeHourlyFee: 24_750 } },
  { pattern: /204호/, pricing: { baseHours: 4, baseFee: 198_000, overtimeHourlyFee: 49_500 } },
];

export function getRentalPricing(facility: FacilityPricingSource): RentalPricing {
  const featurePricing = facility.features || {};
  if (featurePricing.rental_type === "free") {
    return { baseHours: 4, baseFee: 0, overtimeHourlyFee: 0 };
  }
  if (featurePricing.rental_type === "paid") {
    return {
      baseHours: Math.max(1, Number(featurePricing.rental_base_hours) || 4),
      baseFee: Math.max(0, Number(featurePricing.rental_base_fee) || 0),
      overtimeHourlyFee: Math.max(0, Number(featurePricing.rental_overtime_hourly_fee) || 0),
    };
  }

  if (typeof facility.base_fee === "number") {
    return {
      baseHours: facility.base_hours && facility.base_hours > 0 ? facility.base_hours : 4,
      baseFee: Math.max(0, facility.base_fee),
      overtimeHourlyFee: Math.max(0, facility.overtime_hourly_fee ?? 0),
    };
  }

  return DOCUMENT_RATES.find(({ pattern }) => pattern.test(facility.name || ""))?.pricing ?? {
    baseHours: 4,
    baseFee: 0,
    overtimeHourlyFee: 0,
  };
}

export function calculateRentalFee(startAt: string | Date, endAt: string | Date, pricing: RentalPricing) {
  const start = startAt instanceof Date ? startAt : new Date(startAt);
  const end = endAt instanceof Date ? endAt : new Date(endAt);
  const minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60_000));
  const baseMinutes = pricing.baseHours * 60;
  const overtimeHours = Math.max(0, Math.ceil((minutes - baseMinutes) / 60));
  const amount = minutes > 0 ? pricing.baseFee + overtimeHours * pricing.overtimeHourlyFee : 0;

  return { minutes, overtimeHours, amount };
}

const normalizeRentalRuleText = (value: string | null | undefined) =>
  (value || "").replace(/\s+/g, "");

/**
 * 계룡시니어 관련 신청은 202·203·204호에 한해 무상 대관으로 처리합니다.
 * 신청자명 또는 소속 중 한 곳에만 표기되어도 적용하며 띄어쓰기는 무시합니다.
 */
export function isSeniorFreeRental({
  facilityName,
  applicantName,
  applicantDept,
}: SeniorFreeRentalSource) {
  const room = normalizeRentalRuleText(facilityName);
  const applicant = normalizeRentalRuleText(applicantName);
  const department = normalizeRentalRuleText(applicantDept);

  return /20[234]호/.test(room) && (
    applicant.includes("계룡시니어") || department.includes("계룡시니어")
  );
}

export function applySeniorFreeRental(amount: number, source: SeniorFreeRentalSource) {
  return isSeniorFreeRental(source) ? 0 : Math.max(0, amount);
}

/**
 * 신청자명이나 소속에 건양대/건양대학교가 표기된 예약은 무상 대관으로 처리합니다.
 * 부서명이 함께 입력되는 경우를 포함하기 위해 부분 일치로 판정하고 띄어쓰기는 무시합니다.
 */
export function isKonyangUniversityFreeRental({
  applicantName,
  applicantDept,
}: FreeRentalSource) {
  const applicant = normalizeRentalRuleText(applicantName);
  const department = normalizeRentalRuleText(applicantDept);

  return applicant.includes("건양대") || department.includes("건양대");
}

export function getFreeRentalReason(source: FreeRentalSource) {
  if (source.isAdminBooking) return "admin" as const;
  if (isKonyangUniversityFreeRental(source)) return "konyang-university" as const;
  if (isSeniorFreeRental(source)) return "senior" as const;
  return null;
}

export function isFreeRental(source: FreeRentalSource) {
  return getFreeRentalReason(source) !== null;
}

export function applyFreeRental(amount: number, source: FreeRentalSource) {
  return isFreeRental(source) ? 0 : Math.max(0, amount);
}

export function formatWon(amount: number) {
  return `${Math.max(0, amount).toLocaleString("ko-KR")}원`;
}
