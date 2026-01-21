"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ImageUpload from "@/components/ui/ImageUpload";

const featureOptions = [
  { key: "wifi", label: "무선인터넷" },
  { key: "audio", label: "음향시설" },
  { key: "lectern", label: "전자교탁" },
  { key: "projector", label: "프로젝터" },
  { key: "whiteboard", label: "화이트보드" },
  { key: "aircon", label: "에어컨" },
];

export default function NewFacilityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    description: "",
    imageUrl: null as string | null,
    minPeople: 1,
    maxPeople: 10,
    isActive: true,
    features: {} as Record<string, boolean>,
    // 운영 시간
    openTime: "09:00",
    closeTime: "22:00",
    closedDays: [] as number[], // 0=일, 1=월, ... 6=토
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      if (name === "isActive") {
        setFormData((prev) => ({ ...prev, isActive: checked }));
      } else if (name.startsWith("day_")) {
        const day = parseInt(name.split("_")[1]);
        setFormData((prev) => ({
          ...prev,
          closedDays: checked 
            ? [...prev.closedDays, day]
            : prev.closedDays.filter(d => d !== day),
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          features: { ...prev.features, [name]: checked },
        }));
      }
    } else if (type === "number") {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/facilities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          location: formData.location || null,
          description: formData.description || null,
          image_url: formData.imageUrl,
          min_people: formData.minPeople,
          max_people: formData.maxPeople,
          is_active: formData.isActive,
          features: formData.features,
          open_time: formData.openTime,
          close_time: formData.closeTime,
          closed_days: formData.closedDays,
        }),
      });

      const json = await res.json();

      if (!json.ok) {
        throw new Error(json.message || "등록 실패");
      }

      alert("시설물이 등록되었습니다.");
      router.push("/admin/facilities");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const dayLabels = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div style={{ padding: 24, maxWidth: 600 }}>
      <Link href="/admin/facilities" style={{ color: "#3b82f6", fontSize: 14 }}>
        ← 시설물 목록
      </Link>

      <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 12, marginBottom: 24 }}>
        시설물 등록
      </h1>

      {error && (
        <div style={{
          background: "#3a1a1a",
          border: "1px solid #f44",
          borderRadius: 8,
          padding: 12,
          marginBottom: 16,
          color: "#faa",
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* 이미지 업로드 */}
        <div style={{ marginBottom: 20 }}>
          <ImageUpload
            label="시설물 이미지"
            value={formData.imageUrl}
            onChange={(url) => setFormData((prev) => ({ ...prev, imageUrl: url }))}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>시설물명 *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>위치</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="예: 본관 3층 301호"
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>설명</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>최소 인원</label>
            <input
              type="number"
              name="minPeople"
              value={formData.minPeople}
              onChange={handleChange}
              min={1}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>최대 인원</label>
            <input
              type="number"
              name="maxPeople"
              value={formData.maxPeople}
              onChange={handleChange}
              min={1}
              style={inputStyle}
            />
          </div>
        </div>

        {/* 운영 시간 */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>운영 시간</label>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <input
              type="time"
              name="openTime"
              value={formData.openTime}
              onChange={handleChange}
              style={{ ...inputStyle, width: "auto" }}
            />
            <span style={{ color: "#888" }}>~</span>
            <input
              type="time"
              name="closeTime"
              value={formData.closeTime}
              onChange={handleChange}
              style={{ ...inputStyle, width: "auto" }}
            />
          </div>
        </div>

        {/* 휴무일 */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>휴무일</label>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
            {dayLabels.map((label, idx) => (
              <label key={idx} style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  name={`day_${idx}`}
                  checked={formData.closedDays.includes(idx)}
                  onChange={handleChange}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>시설 특성</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
            {featureOptions.map((opt) => (
              <label key={opt.key} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  name={opt.key}
                  checked={formData.features[opt.key] || false}
                  onChange={handleChange}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
            />
            활성화 (예약 가능)
          </label>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <Link
            href="/admin/facilities"
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 10,
              border: "1px solid #444",
              background: "transparent",
              color: "#aaa",
              textDecoration: "none",
              textAlign: "center",
              fontSize: 14,
            }}
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={loading}
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 10,
              border: "none",
              background: loading ? "#444" : "#3b82f6",
              color: "white",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {loading ? "등록 중..." : "등록"}
          </button>
        </div>
      </form>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 6,
  fontSize: 14,
  color: "#aaa",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #333",
  background: "#0f0f0f",
  color: "white",
  fontSize: 14,
};
