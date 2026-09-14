"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ImageUpload from "@/components/ui/ImageUpload";
import { getRentalPricing } from "@/lib/rental-fee";

const featureOptions = [
  { key: "wifi", label: "무선인터넷" },
  { key: "audio", label: "음향시설" },
  { key: "lectern", label: "전자교탁" },
  { key: "projector", label: "프로젝터" },
  { key: "whiteboard", label: "화이트보드" },
  { key: "aircon", label: "에어컨" },
];

export default function EditFacilityPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
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
    openTime: "09:00",
    closeTime: "22:00",
    closedDays: [] as number[],
    rentalType: "free" as "free" | "paid",
    rentalBaseHours: 4,
    rentalBaseFee: 0,
    rentalOvertimeHourlyFee: 0,
  });

  useEffect(() => {
    const fetchFacility = async () => {
      try {
        const res = await fetch(`/api/facilities/${id}`);
        const json = await res.json();

        if (!json.ok) {
          throw new Error(json.message || "시설물을 찾을 수 없습니다.");
        }

        const f = json.facility;
        const rentalPricing = getRentalPricing(f);
        setFormData({
          name: f.name || "",
          location: f.location || "",
          description: f.description || "",
          imageUrl: f.image_url || null,
          minPeople: f.min_people || 1,
          maxPeople: f.max_people || 10,
          isActive: f.is_active ?? true,
          features: f.features || {},
          openTime: f.open_time || "09:00",
          closeTime: f.close_time || "22:00",
          closedDays: f.closed_days || [],
          rentalType: f.features?.rental_type || (rentalPricing.baseFee > 0 ? "paid" : "free"),
          rentalBaseHours: rentalPricing.baseHours,
          rentalBaseFee: rentalPricing.baseFee,
          rentalOvertimeHourlyFee: rentalPricing.overtimeHourlyFee,
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setFetching(false);
      }
    };

    if (id) fetchFacility();
  }, [id]);

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
    if (formData.rentalType === "paid" && formData.rentalBaseFee <= 0) {
      setError("유료 대관의 기본 요금을 입력해주세요.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/facilities/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          location: formData.location || null,
          description: formData.description || null,
          image_url: formData.imageUrl,
          min_people: formData.minPeople,
          max_people: formData.maxPeople,
          is_active: formData.isActive,
          features: {
            ...formData.features,
            rental_type: formData.rentalType,
            rental_base_hours: formData.rentalBaseHours,
            rental_base_fee: formData.rentalType === "paid" ? formData.rentalBaseFee : 0,
            rental_overtime_hourly_fee: formData.rentalType === "paid" ? formData.rentalOvertimeHourlyFee : 0,
          },
          open_time: formData.openTime,
          close_time: formData.closeTime,
          closed_days: formData.closedDays,
        }),
      });

      const json = await res.json();

      if (!json.ok) {
        throw new Error(json.message || "수정 실패");
      }

      alert("수정되었습니다.");
      router.push("/admin/facilities");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const dayLabels = ["일", "월", "화", "수", "목", "금", "토"];

  if (fetching) {
    return <div style={{ padding: 24, color: "#888" }}>로딩 중...</div>;
  }

  return (
    <div style={{ padding: 24, maxWidth: 600 }}>
      <Link href="/admin/facilities" style={{ color: "#3b82f6", fontSize: 14 }}>
        ← 시설물 목록
      </Link>

      <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 12, marginBottom: 24 }}>
        시설물 수정
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

        <div style={{ marginBottom: 24, padding: 16, border: "1px solid #333", borderRadius: 10, background: "#111" }}>
          <label style={{ ...labelStyle, marginBottom: 10 }}>대관 요금 구분</label>
          <div style={{ display: "flex", gap: 10, marginBottom: formData.rentalType === "paid" ? 16 : 0 }}>
            {(["free", "paid"] as const).map((type) => (
              <label key={type} style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "11px 12px", border: `1px solid ${formData.rentalType === type ? "#3b82f6" : "#333"}`, borderRadius: 8, cursor: "pointer", color: formData.rentalType === type ? "#60a5fa" : "#aaa" }}>
                <input type="radio" name="rentalType" value={type} checked={formData.rentalType === type} onChange={() => setFormData((prev) => ({ ...prev, rentalType: type }))} />
                {type === "free" ? "무료 대관" : "유료 대관"}
              </label>
            ))}
          </div>
          {formData.rentalType === "paid" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
              <div><label style={labelStyle}>기본 시간</label><input type="number" name="rentalBaseHours" min={1} value={formData.rentalBaseHours} onChange={handleChange} style={inputStyle} /></div>
              <div><label style={labelStyle}>기본 요금(원)</label><input type="number" name="rentalBaseFee" min={0} step={1000} value={formData.rentalBaseFee} onChange={handleChange} style={inputStyle} /></div>
              <div><label style={labelStyle}>초과 시간당(원)</label><input type="number" name="rentalOvertimeHourlyFee" min={0} step={1000} value={formData.rentalOvertimeHourlyFee} onChange={handleChange} style={inputStyle} /></div>
            </div>
          )}
          {formData.rentalType === "free" && <p style={{ margin: "10px 0 0", color: "#777", fontSize: 13 }}>예약 금액과 대관수입 통계에 0원으로 반영됩니다.</p>}
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
            {loading ? "저장 중..." : "저장"}
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
