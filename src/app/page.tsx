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
    <div className="home-page">
      <a className="ky-skip" href="#main-content">본문 바로가기</a>
      <header className="ky-header">
        <div className="ky-utility-bar">
          <div className="ky-shell ky-utility-inner">
            <a className="ky-university-logo" href="https://www.konyang.ac.kr" target="_blank" rel="noopener noreferrer">
              <img src="/konyang/logo.png" alt="건양대학교" />
            </a>
            <HeaderAuth />
          </div>
        </div>
        <div className="ky-nav-bar">
          <div className="ky-shell ky-nav-inner">
            <Link className="ky-service-logo" href="/">
              <strong>계룡평생교육원</strong><span>시설예약</span>
            </Link>
            <nav className="ky-desktop-nav" aria-label="주 메뉴">
              <a href="#facilities">시설안내</a>
              <a href="#reservation-status">예약현황</a>
              <a href="#facilities">시설예약</a>
              <Link href="/reservation" prefetch={false}>내 예약 조회</Link>
              <Link href="/checkin" prefetch={false}>QR 체크인</Link>
            </nav>
            <details className="ky-mobile-nav">
              <summary aria-label="메뉴 열기"><span /><span /><span /></summary>
              <div>
                <a href="#facilities">시설안내</a><a href="#reservation-status">예약현황</a><a href="#facilities">시설예약</a>
                <Link href="/reservation" prefetch={false}>내 예약 조회</Link><Link href="/checkin" prefetch={false}>QR 체크인</Link>
              </div>
            </details>
          </div>
        </div>
      </header>

      <main id="main-content">
        <section className="ky-hero">
          <div className="ky-shell ky-hero-content">
            <p className="ky-eyebrow">KONYANG UNIVERSITY · GYERYONG</p>
            <h1>배움이 이어지는 공간,<br />간편하게 예약하세요</h1>
            <p className="ky-hero-copy">계룡평생교육원 강의실 현황을 확인하고 원하는 시간에 예약할 수 있습니다.</p>
            <a className="ky-hero-button" href="#facilities">시설 예약하기 <span aria-hidden="true">→</span></a>
          </div>
        </section>
        <section className="ky-quick-links" aria-label="빠른 메뉴">
          <div className="ky-shell ky-quick-grid">
            <a href="#facilities"><span className="ky-quick-icon">⌂</span><span><small>FACILITIES</small>시설 안내</span></a>
            <a href="#reservation-status"><span className="ky-quick-icon">▦</span><span><small>SCHEDULE</small>예약 현황</span></a>
            <Link href="/reservation" prefetch={false}><span className="ky-quick-icon">✓</span><span><small>MY BOOKING</small>내 예약 조회</span></Link>
            <Link href="/checkin" prefetch={false}><span className="ky-quick-icon">▣</span><span><small>CHECK-IN</small>QR 체크인</span></Link>
          </div>
        </section>
        <section className="ky-home-info" id="reservation-status">
          <div className="ky-shell ky-home-info-grid"><NoticeList /><DashboardClient /></div>
        </section>
        <HomeClient facilities={facilities} />
      </main>

      <footer className="ky-footer">
        <div className="ky-partner-bar"><div className="ky-shell">
          <strong>관련 사이트</strong>
          <a href="https://www.konyang.ac.kr" target="_blank" rel="noopener noreferrer">건양대학교</a>
          <a href="https://leaders.konyang.ac.kr/leaders.do" target="_blank" rel="noopener noreferrer">평생교육원</a>
          <a href="https://sites.google.com/d/1vaqyC_wLXOUP-UWwLMARmyS8sJf9AmL7/p/1VAkK7t33fSPzxZ8dq9yV9i1ZTTePuFOG/edit" target="_blank" rel="noopener noreferrer">개인정보처리방침</a>
        </div></div>
        <div className="ky-footer-main"><div className="ky-shell ky-footer-inner">
          <div><p><strong>계룡평생교육원</strong> · 32801 충청남도 계룡시 신도안3길 72 계룡대학습관</p><p>TEL 042-551-1543 <span>·</span> E-mail pik8241@konyang.ac.kr</p><small>COPYRIGHT © KONYANG UNIVERSITY. ALL RIGHTS RESERVED.</small></div>
          <img src="/konyang/logo-footer.png" alt="건양대학교" />
        </div></div>
      </footer>
    </div>
  );
}
