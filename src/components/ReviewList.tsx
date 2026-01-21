"use client";

import { useState, useEffect } from "react";

interface Review {
  id: string;
  rating: number;
  content: string;
  author_name: string;
  created_at: string;
}

interface ReviewListProps {
  facilityId: string;
}

export default function ReviewList({ facilityId }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch(`/api/reviews?facilityId=${facilityId}&limit=10`);
        const json = await res.json();
        if (json.ok) {
          setReviews(json.reviews || []);
          setAvgRating(json.avgRating || 0);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [facilityId]);

  if (loading) {
    return <div style={{ color: "var(--text-muted, #888)", padding: 20 }}>로딩 중...</div>;
  }

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>이용 후기</h3>
        {reviews.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ color: "#fbbf24", fontSize: 18 }}>★</span>
            <span style={{ fontWeight: 600 }}>{avgRating}</span>
            <span style={{ color: "var(--text-muted, #888)", fontSize: 13 }}>({reviews.length})</span>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <div style={{
          padding: 24,
          background: "var(--card-bg, #1a1a1a)",
          borderRadius: 12,
          color: "var(--text-muted, #888)",
          textAlign: "center",
          fontSize: 14,
        }}>
          아직 등록된 후기가 없습니다.
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 600 }}>{review.author_name}</span>
                  <div style={{ color: "#fbbf24" }}>
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </div>
                </div>
                <span style={{ fontSize: 12, color: "var(--text-muted, #888)" }}>
                  {new Date(review.created_at).toLocaleDateString("ko-KR")}
                </span>
              </div>
              {review.content && (
                <p style={{ margin: 0, fontSize: 14, color: "var(--text-muted, #ccc)", lineHeight: 1.6 }}>
                  {review.content}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 리뷰 작성 폼
interface ReviewFormProps {
  reservationId: string;
  onSuccess?: () => void;
}

export function ReviewForm({ reservationId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservation_id: reservationId,
          rating,
          content,
          author_name: authorName,
        }),
      });

      const json = await res.json();

      if (!json.ok) {
        throw new Error(json.message);
      }

      setMessage({ type: "success", text: "리뷰가 등록되었습니다!" });
      setContent("");
      onSuccess?.();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
      {message && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: 8,
            marginBottom: 16,
            background: message.type === "success" ? "#1a3a1a" : "#3a1a1a",
            border: `1px solid ${message.type === "success" ? "#22c55e" : "#ef4444"}`,
            color: message.type === "success" ? "#4ade80" : "#fca5a5",
            fontSize: 14,
          }}
        >
          {message.text}
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "var(--text-muted, #aaa)" }}>
          작성자 이름
        </label>
        <input
          type="text"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          required
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid var(--border-color, #333)",
            background: "var(--background, #0f0f0f)",
            color: "var(--foreground, white)",
            fontSize: 14,
          }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "var(--text-muted, #aaa)" }}>
          별점
        </label>
        <div style={{ display: "flex", gap: 4 }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 28,
                color: star <= rating ? "#fbbf24" : "#444",
                padding: 0,
              }}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "var(--text-muted, #aaa)" }}>
          후기 내용
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder="시설 이용 후기를 작성해주세요."
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid var(--border-color, #333)",
            background: "var(--background, #0f0f0f)",
            color: "var(--foreground, white)",
            fontSize: 14,
            resize: "vertical",
          }}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          padding: "10px 20px",
          borderRadius: 8,
          border: "none",
          background: loading ? "#444" : "var(--color-primary, #3b82f6)",
          color: "white",
          cursor: loading ? "not-allowed" : "pointer",
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        {loading ? "등록 중..." : "리뷰 등록"}
      </button>
    </form>
  );
}
