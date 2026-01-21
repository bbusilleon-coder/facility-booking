"use client";

import { useState, useEffect } from "react";

interface Review {
  id: string;
  rating: number;
  content: string;
  author_name: string;
  is_visible: boolean;
  created_at: string;
  facility?: {
    id: string;
    name: string;
  };
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reviews?limit=100");
      const json = await res.json();
      if (json.ok) {
        setReviews(json.reviews || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("이 리뷰를 숨기시겠습니까?")) return;

    try {
      const res = await fetch(`/api/reviews?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.ok) {
        fetchReviews();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 평균 별점 계산
  const avgRating = reviews.length > 0
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
    : 0;

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>리뷰 관리</h1>
      <p style={{ color: "var(--text-muted, #888)", marginBottom: 24, fontSize: 14 }}>
        시설 이용 후기를 관리합니다.
      </p>

      {/* 통계 */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: 16,
        marginBottom: 24,
      }}>
        <div style={{
          background: "var(--card-bg, #1a1a1a)",
          borderRadius: 12,
          padding: 20,
          textAlign: "center",
        }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "var(--color-primary, #3b82f6)" }}>
            {reviews.length}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted, #888)", marginTop: 4 }}>총 리뷰</div>
        </div>
        <div style={{
          background: "var(--card-bg, #1a1a1a)",
          borderRadius: 12,
          padding: 20,
          textAlign: "center",
        }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "#fbbf24" }}>
            ★ {avgRating}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted, #888)", marginTop: 4 }}>평균 별점</div>
        </div>
      </div>

      {loading ? (
        <div style={{ color: "var(--text-muted, #888)", padding: 40, textAlign: "center" }}>로딩 중...</div>
      ) : reviews.length === 0 ? (
        <div style={{
          padding: 40,
          background: "var(--card-bg, #1a1a1a)",
          borderRadius: 12,
          textAlign: "center",
          color: "var(--text-muted, #888)",
        }}>
          등록된 리뷰가 없습니다.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {reviews.map((review) => (
            <div
              key={review.id}
              style={{
                background: "var(--card-bg, #1a1a1a)",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontWeight: 600 }}>{review.facility?.name || "시설"}</span>
                    <div style={{ color: "#fbbf24" }}>
                      {"★".repeat(review.rating)}
                      {"☆".repeat(5 - review.rating)}
                    </div>
                  </div>
                  <div style={{ fontSize: 14, color: "var(--text-muted, #ccc)", marginBottom: 8 }}>
                    {review.content || "(내용 없음)"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted, #888)" }}>
                    {review.author_name} · {new Date(review.created_at).toLocaleDateString("ko-KR")}
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(review.id)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "1px solid #ef4444",
                    background: "transparent",
                    color: "#ef4444",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  숨기기
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
