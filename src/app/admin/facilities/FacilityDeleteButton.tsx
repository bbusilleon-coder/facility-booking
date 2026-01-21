"use client";

import { useRouter } from "next/navigation";

type Props = {
  facilityId: string;
  facilityName: string;
};

export default function FacilityDeleteButton({ facilityId, facilityName }: Props) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`"${facilityName}" 시설물을 삭제하시겠습니까?\n\n관련 예약도 함께 삭제됩니다.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/facilities/${facilityId}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!json.ok) {
        throw new Error(json.message || "삭제 실패");
      }

      alert("삭제되었습니다.");
      router.refresh();
    } catch (err: any) {
      alert("삭제 실패: " + err.message);
    }
  };

  return (
    <button
      onClick={handleDelete}
      style={{
        padding: "6px 12px",
        borderRadius: 6,
        border: "1px solid #ef4444",
        background: "transparent",
        color: "#ef4444",
        cursor: "pointer",
        fontSize: 13,
      }}
    >
      삭제
    </button>
  );
}
