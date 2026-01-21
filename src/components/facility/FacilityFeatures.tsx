"use client";

import { FacilityFeatures as FacilityFeaturesType, FEATURE_LABELS } from "@/types";

interface FacilityFeaturesProps {
  features: FacilityFeaturesType;
  onChange: (features: FacilityFeaturesType) => void;
  disabled?: boolean;
}

const featureKeys = Object.keys(FEATURE_LABELS) as (keyof FacilityFeaturesType)[];

export function FacilityFeatures({ features, onChange, disabled = false }: FacilityFeaturesProps) {
  const handleChange = (key: keyof FacilityFeaturesType) => {
    onChange({
      ...features,
      [key]: !features[key],
    });
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">시설 특성</label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {featureKeys.map((key) => (
          <label
            key={key}
            className={`
              flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors
              ${features[key] ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"}
              ${disabled ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            <input
              type="checkbox"
              checked={features[key] || false}
              onChange={() => handleChange(key)}
              disabled={disabled}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{FEATURE_LABELS[key]}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
