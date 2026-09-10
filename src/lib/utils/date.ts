import { format, parseISO, isValid } from "date-fns";
import { ko } from "date-fns/locale";

// ISO 문자열을 한국어 날짜로 포맷
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";
  const date = parseISO(dateString);
  if (!isValid(date)) return "-";
  return format(date, "yyyy년 M월 d일", { locale: ko });
};

// ISO 문자열을 날짜+시간으로 포맷
export const formatDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";
  const date = parseISO(dateString);
  if (!isValid(date)) return "-";
  return format(date, "yyyy년 M월 d일 HH:mm", { locale: ko });
};

// ISO 문자열을 시간만 포맷
export const formatTime = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";
  const date = parseISO(dateString);
  if (!isValid(date)) return "-";
  return format(date, "HH:mm", { locale: ko });
};

// 짧은 날짜 포맷 (M/d)
export const formatShortDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "-";
  const date = parseISO(dateString);
  if (!isValid(date)) return "-";
  return format(date, "M/d (EEE)", { locale: ko });
};

// 캘린더용 ISO 문자열 생성 (KST 타임존 명시)
export const toKSTString = (date: Date): string => {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${y}-${m}-${d}T${hh}:${mm}:00+09:00`;
};

// 하위호환용 (기존 코드에서 사용중인 경우)
export const toISOString = toKSTString;

// datetime-local input용 포맷
export const toDateTimeLocalValue = (dateString: string | null | undefined): string => {
  if (!dateString) return "";
  const date = parseISO(dateString);
  if (!isValid(date)) return "";
  return format(date, "yyyy-MM-dd'T'HH:mm");
};

// datetime-local input 값을 KST ISO로 변환
export const fromDateTimeLocalValue = (value: string): string => {
  if (!value) return "";
  // "YYYY-MM-DDTHH:mm" -> "YYYY-MM-DDTHH:mm:00+09:00"
  return value + ":00+09:00";
};
