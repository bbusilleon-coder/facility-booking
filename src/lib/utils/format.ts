// 전화번호 포맷팅 (010-1234-5678)
export const formatPhone = (phone: string | null | undefined): string => {
  if (!phone) return "-";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

// 인원수 표시
export const formatPeopleRange = (min: number, max: number): string => {
  if (min === max) return `${min}명`;
  return `${min}~${max}명`;
};

// 클래스명 병합 (tailwind merge 간소화)
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(" ");
};
