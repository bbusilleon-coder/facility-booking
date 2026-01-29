import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import DashboardClient from "@/components/DashboardClient";
import NoticeList from "@/components/NoticeList";
import HomeClient from "@/components/HomeClient";
import HeaderAuth from "@/components/HeaderAuth";

type Facility = {
  id: string;
  name: string;
  location: string | null;
  description: string | null;
  image_url: string | null;
  min_people: number;
  max_people: number;
  features: Record<string, boolean> | null;
  is_active: boolean;
};

async function getFacilities(): Promise<Facility[]> {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from("facilities")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to fetch facilities:", error);
    return [];
  }

  return data || [];
}

export default async function Home() {
  const facilities = await getFacilities();

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <main style={{ flex: 1, maxWidth: 1200, margin: "0 auto", padding: 24, color: "white", width: "100%" }}>
        {/* 헤더 */}
        <header style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          marginBottom: 24,
          paddingBottom: 16,
          borderBottom: "1px solid var(--border-color, #222)",
          flexWrap: "wrap",
          gap: 12,
        }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>계룡대 학습관 강의실 예약 시스템</h1>
            <p style={{ color: "var(--text-muted, #888)", marginTop: 4, fontSize: 14 }}>
              강의실을 선택하고 예약을 진행합니다.
            </p>
          </div>
          <HeaderAuth />
        </header>

        {/* 공지사항 */}
        <NoticeList />

        {/* 대시보드 */}
        <DashboardClient />

        {/* 시설물 목록 (클라이언트 컴포넌트) */}
        <HomeClient facilities={facilities} />
      </main>

      {/* 푸터 */}
      <footer style={{
        borderTop: "1px solid var(--border-color, #222)",
        padding: "24px 16px",
        textAlign: "center",
        background: "var(--background, #0a0a0a)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <p style={{ color: "var(--text-muted, #888)", fontSize: 13, lineHeight: 1.8, margin: 0 }}>
            <strong style={{ color: "var(--foreground, #aaa)" }}>계룡대학습관(계룡)</strong>{" "}
            32801 충남 계룡시 신도안3길 72 계룡대학습관
          </p>
          <p style={{ color: "var(--text-muted, #888)", fontSize: 13, margin: "4px 0 0 0" }}>
            TEL: 042-551-1543 &nbsp;|&nbsp; E-mail: pik8241@konyang.ac.kr
          </p>
          <p style={{ margin: "12px 0 0 0" }}>
            <a 
              href="https://sites.google.com/d/1vaqyC_wLXOUP-UWwLMARmyS8sJf9AmL7/p/1VAkK7t33fSPzxZ8dq9yV9i1ZTTePuFOG/edit"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#6b7280", fontSize: 12, textDecoration: "none" }}
            >
              개인정보처리방침
            </a>
          </p>
          <p style={{ color: "#555", fontSize: 12, marginTop: 12 }}>
            Copyrightⓒbbusilleon 2026. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
