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

export function formatWon(amount: number) {
  return `${Math.max(0, amount).toLocaleString("ko-KR")}원`;
}
