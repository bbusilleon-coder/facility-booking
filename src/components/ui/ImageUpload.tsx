"use client";

import { useState, useRef } from "react";

type Props = {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
};

export default function ImageUpload({ value, onChange, label = "이미지" }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "facilities");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!json.ok) {
        throw new Error(json.message || "업로드 실패");
      }

      onChange(json.url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
      // 같은 파일 재선택 가능하도록
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    onChange(null);
  };

  return (
    <div>
      <label style={{ display: "block", marginBottom: 8, fontSize: 14, color: "var(--text-secondary, #aaa)" }}>
        {label}
      </label>

      {value ? (
        <div style={{ position: "relative", display: "inline-block" }}>
          <img
            src={value}
            alt="업로드된 이미지"
            style={{
              width: 200,
              height: 150,
              objectFit: "cover",
              borderRadius: 8,
              border: "1px solid var(--border-color, #333)",
            }}
          />
          <button
            type="button"
            onClick={handleRemove}
            style={{
              position: "absolute",
              top: -8,
              right: -8,
              width: 24,
              height: 24,
              borderRadius: "50%",
              border: "none",
              background: "#ef4444",
              color: "white",
              cursor: "pointer",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          style={{
            width: 200,
            height: 150,
            border: "2px dashed var(--border-color, #333)",
            borderRadius: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: uploading ? "not-allowed" : "pointer",
            background: "var(--input-bg, #0f0f0f)",
            color: "var(--text-subtle, #666)",
            fontSize: 13,
          }}
        >
          {uploading ? (
            <span>업로드 중...</span>
          ) : (
            <>
              <span style={{ fontSize: 24, marginBottom: 8 }}>📷</span>
              <span>클릭하여 업로드</span>
              <span style={{ fontSize: 11, marginTop: 4 }}>5MB 이하</span>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {error && (
        <div style={{ color: "#f44", fontSize: 13, marginTop: 8 }}>
          {error}
        </div>
      )}
    </div>
  );
}
