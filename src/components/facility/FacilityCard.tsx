"use client";

import Link from "next/link";
import Image from "next/image";
import { Facility, FEATURE_LABELS } from "@/types";
import { Badge, Card } from "@/components/ui";
import { formatPeopleRange } from "@/lib/utils";

interface FacilityCardProps {
  facility: Facility;
  showAdminActions?: boolean;
}

export function FacilityCard({ facility, showAdminActions = false }: FacilityCardProps) {
  const enabledFeatures = facility.features
    ? Object.entries(facility.features)
        .filter(([, value]) => value)
        .map(([key]) => key as keyof typeof FEATURE_LABELS)
    : [];

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row">
        {/* 이미지 영역 */}
        <div className="relative w-full md:w-48 h-48 md:h-auto bg-gray-100 flex-shrink-0">
          {facility.image_url ? (
            <Image
              src={facility.image_url}
              alt={facility.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          )}
          {!facility.is_active && (
            <div className="absolute top-2 left-2">
              <Badge variant="danger">비활성</Badge>
            </div>
          )}
        </div>

        {/* 정보 영역 */}
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{facility.name}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {facility.location || "위치 미입력"} · {formatPeopleRange(facility.min_people, facility.max_people)}
              </p>
            </div>
          </div>

          {facility.description && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">{facility.description}</p>
          )}

          {/* 시설 특성 배지 */}
          {enabledFeatures.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {enabledFeatures.slice(0, 4).map((key) => (
                <Badge key={key} variant="info">
                  {FEATURE_LABELS[key]}
                </Badge>
              ))}
              {enabledFeatures.length > 4 && (
                <Badge variant="default">+{enabledFeatures.length - 4}</Badge>
              )}
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex items-center gap-2 mt-4">
            {showAdminActions ? (
              <>
                <Link
                  href={`/admin/facilities/${facility.id}`}
                  className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  수정
                </Link>
                <Link
                  href={`/facilities/${facility.id}`}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  미리보기
                </Link>
              </>
            ) : (
              <Link
                href={`/facilities/${facility.id}`}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                예약하기
              </Link>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
