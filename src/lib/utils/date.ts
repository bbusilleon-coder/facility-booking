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

// 캘린더용 ISO 문자열 생성
export const toISOString = (date: Date): string => {
  return date.toISOString();
};

// datetime-local input용 포맷
export const toDateTimeLocalValue = (dateString: string | null | undefined): string => {
  if (!dateString) return "";
  const date = parseISO(dateString);
  if (!isValid(date)) return "";
  return format(date, "yyyy-MM-dd'T'HH:mm");
};

// datetime-local input 값을 ISO로 변환
export const fromDateTimeLocalValue = (value: string): string => {
  if (!value) return "";
  return new Date(value).toISOString();
};
