"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Facility, FacilityFormData, FacilityFeatures as FacilityFeaturesType } from "@/types";
import { Button, Input, Textarea } from "@/components/ui";
import { FacilityFeatures } from "./FacilityFeatures";
import { FacilityImageUpload } from "./FacilityImageUpload";

interface FacilityFormProps {
  facility?: Facility;
  onSubmit: (data: FacilityFormData) => Promise<void>;
}

const initialFeatures: FacilityFeaturesType = {
  wifi: false,
  audio: false,
  lectern: false,
  projector: false,
  whiteboard: false,
  aircon: false,
  parking: false,
  accessible: false,
};

export function FacilityForm({ facility, onSubmit }: FacilityFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FacilityFormData>({
    name: facility?.name || "",
    location: facility?.location || "",
    description: facility?.description || "",
    image_url: facility?.image_url || "",
    images: facility?.images || [],
    min_people: facility?.min_people || 1,
    max_people: facility?.max_people || 10,
    features: facility?.features || initialFeatures,
    is_active: facility?.is_active ?? true,
  });

  const handleChange = (field: keyof FacilityFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("시설물명을 입력해주세요.");
      return;
    }

    if (formData.min_people > formData.max_people) {
      setError("최소 인원이 최대 인원보다 클 수 없습니다.");
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(formData);
      router.push("/admin/facilities");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "저장 중 오류가 발생했습니다.");
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

      {/* 기본 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="시설물명"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="예: 대회의실 A"
          required
        />
        <Input
          label="위치"
          value={formData.location}
          onChange={(e) => handleChange("location", e.target.value)}
          placeholder="예: 본관 3층"
        />
      </div>

      <Textarea
        label="설명"
        value={formData.description}
        onChange={(e) => handleChange("description", e.target.value)}
        placeholder="시설물에 대한 상세 설명을 입력하세요"
        rows={3}
      />

      {/* 인원 설정 */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="최소 인원"
          type="number"
          min={1}
          value={formData.min_people}
          onChange={(e) => handleChange("min_people", parseInt(e.target.value) || 1)}
        />
        <Input
          label="최대 인원"
          type="number"
          min={1}
          value={formData.max_people}
          onChange={(e) => handleChange("max_people", parseInt(e.target.value) || 1)}
        />
      </div>

      {/* 이미지 업로드 */}
      <FacilityImageUpload
        imageUrl={formData.image_url}
        images={formData.images}
        onMainImageChange={(url) => handleChange("image_url", url)}
        onImagesChange={(urls) => handleChange("images", urls)}
      />

      {/* 시설 특성 */}
      <FacilityFeatures
        features={formData.features}
        onChange={(features) => handleChange("features", features)}
      />

      {/* 활성화 상태 */}
      <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
        <input
          type="checkbox"
          checked={formData.is_active}
          onChange={(e) => handleChange("is_active", e.target.checked)}
          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
        />
        <div>
          <div className="font-medium text-gray-900">시설물 활성화</div>
          <div className="text-sm text-gray-500">비활성화하면 예약이 불가능합니다</div>
        </div>
      </label>

      {/* 버튼 */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          취소
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {facility ? "수정하기" : "등록하기"}
        </Button>
      </div>
    </form>
  );
}
