"use client";

import { useState } from "react";
import { ReservationFormData, Facility } from "@/types";
import { Button, Input, Textarea } from "@/components/ui";
import { toDateTimeLocalValue, fromDateTimeLocalValue } from "@/lib/utils";

interface ReservationFormProps {
  facility: Facility;
  initialStartDate?: Date;
  initialEndDate?: Date;
  onSubmit: (data: ReservationFormData) => Promise<void>;
  onCancel: () => void;
}

export function ReservationForm({
  facility,
  initialStartDate,
  initialEndDate,
  onSubmit,
  onCancel,
}: ReservationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<ReservationFormData>({
    facility_id: facility.id,
    start_at: initialStartDate?.toISOString() || "",
    end_at: initialEndDate?.toISOString() || "",
    purpose: "",
    attendees: facility.min_people,
    applicant_name: "",
    applicant_phone: "",
    applicant_email: "",
    applicant_dept: "",
    notes: "",
  });

  const handleChange = (field: keyof ReservationFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 유효성 검사
    if (!formData.start_at || !formData.end_at) {
      setError("예약 시간을 선택해주세요.");
      return;
    }
    if (new Date(formData.start_at) >= new Date(formData.end_at)) {
      setError("종료 시간은 시작 시간보다 늦어야 합니다.");
      return;
    }
    if (!formData.purpose.trim()) {
      setError("사용 목적을 입력해주세요.");
      return;
    }
    if (formData.attendees < facility.min_people || formData.attendees > facility.max_people) {
      setError(`참석 인원은 ${facility.min_people}~${facility.max_people}명 사이여야 합니다.`);
      return;
    }
    if (!formData.applicant_name.trim()) {
      setError("신청자 이름을 입력해주세요.");
      return;
    }
    if (!formData.applicant_phone.trim()) {
      setError("연락처를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(formData);
    } catch (err: any) {
      setError(err.message || "예약 신청 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* 시설물 정보 */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="font-medium text-gray-900">{facility.name}</div>
        <div className="text-sm text-gray-500 mt-1">
          {facility.location} · {facility.min_people}~{facility.max_people}명
        </div>
      </div>

      {/* 예약 시간 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="시작 일시"
          type="datetime-local"
          value={toDateTimeLocalValue(formData.start_at)}
          onChange={(e) => handleChange("start_at", fromDateTimeLocalValue(e.target.value))}
          required
        />
        <Input
          label="종료 일시"
          type="datetime-local"
          value={toDateTimeLocalValue(formData.end_at)}
          onChange={(e) => handleChange("end_at", fromDateTimeLocalValue(e.target.value))}
          required
        />
      </div>

      {/* 사용 목적 및 인원 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Input
            label="사용 목적"
            value={formData.purpose}
            onChange={(e) => handleChange("purpose", e.target.value)}
            placeholder="예: 팀 회의, 교육, 세미나 등"
            required
          />
        </div>
        <Input
          label="참석 인원"
          type="number"
          min={facility.min_people}
          max={facility.max_people}
          value={formData.attendees}
          onChange={(e) => handleChange("attendees", parseInt(e.target.value) || 1)}
          helperText={`${facility.min_people}~${facility.max_people}명`}
          required
        />
      </div>

      {/* 신청자 정보 */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">신청자 정보</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="이름"
            value={formData.applicant_name}
            onChange={(e) => handleChange("applicant_name", e.target.value)}
            placeholder="홍길동"
            required
          />
          <Input
            label="연락처"
            value={formData.applicant_phone}
            onChange={(e) => handleChange("applicant_phone", e.target.value)}
            placeholder="010-1234-5678"
            required
          />
          <Input
            label="이메일"
            type="email"
            value={formData.applicant_email}
            onChange={(e) => handleChange("applicant_email", e.target.value)}
            placeholder="example@email.com"
          />
          <Input
            label="소속/부서"
            value={formData.applicant_dept}
            onChange={(e) => handleChange("applicant_dept", e.target.value)}
            placeholder="예: 기획팀"
          />
        </div>
      </div>

      {/* 비고 */}
      <Textarea
        label="비고"
        value={formData.notes}
        onChange={(e) => handleChange("notes", e.target.value)}
        placeholder="기타 요청사항이 있으면 입력해주세요"
        rows={3}
      />

      {/* 버튼 */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" isLoading={isLoading}>
          예약 신청
        </Button>
      </div>
    </form>
  );
}
