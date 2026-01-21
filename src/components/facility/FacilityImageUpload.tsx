"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui";

interface FacilityImageUploadProps {
  imageUrl: string;
  images: string[];
  onMainImageChange: (url: string) => void;
  onImagesChange: (urls: string[]) => void;
}

export function FacilityImageUpload({
  imageUrl,
  images,
  onMainImageChange,
  onImagesChange,
}: FacilityImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (file: File, isMain: boolean) => {
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("업로드 실패");

      const { url } = await res.json();

      if (isMain) {
        onMainImageChange(url);
      } else {
        onImagesChange([...images, url]);
      }
    } catch (err) {
      alert("이미지 업로드에 실패했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleMainImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file, true);
  };

  const handleAdditionalImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file, false);
  };

  const removeAdditionalImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* 대표 이미지 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">대표 이미지</label>
        <div className="flex items-start gap-4">
          <div className="relative w-40 h-40 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
            {imageUrl ? (
              <>
                <Image src={imageUrl} alt="대표 이미지" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => onMainImageChange("")}
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </>
            ) : (
              <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="mt-1 text-xs text-gray-500">클릭하여 업로드</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleMainImageSelect}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            )}
          </div>
          <div className="text-sm text-gray-500">
            <p>권장 크기: 800x600px</p>
            <p>지원 형식: JPG, PNG, WebP</p>
          </div>
        </div>
      </div>

      {/* 추가 이미지 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          추가 이미지 ({images.length}개)
        </label>
        <div className="flex flex-wrap gap-3">
          {images.map((url, index) => (
            <div key={index} className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
              <Image src={url} alt={`추가 이미지 ${index + 1}`} fill className="object-cover" />
              <button
                type="button"
                onClick={() => removeAdditionalImage(index)}
                className="absolute top-1 right-1 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="mt-1 text-xs text-gray-500">추가</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleAdditionalImageSelect}
              className="hidden"
              disabled={isUploading}
            />
          </label>
        </div>
      </div>

      {isUploading && (
        <div className="text-sm text-blue-600">업로드 중...</div>
      )}
    </div>
  );
}
