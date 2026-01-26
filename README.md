# 시설물 예약 시스템

계룡대학습관 시설물 예약 관리 시스템

## 🚀 시작하기

### 환경 설정

1. `.env.local` 파일 생성:
```bash
cp .env.example .env.local
```

2. Supabase 환경변수 설정:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 설치 및 실행

```bash
npm install
npm run dev
```

http://localhost:3000 에서 확인

## 📦 Vercel 배포

### 1. GitHub에 Push
```bash
git add .
git commit -m "Deploy"
git push origin main
```

### 2. Vercel에서 Import
1. [vercel.com](https://vercel.com) 로그인
2. "Add New Project" 클릭
3. GitHub 저장소 선택
4. 환경변수 설정:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy 클릭

## 🗄️ 데이터베이스 설정 (Supabase)

### 필수 테이블
Supabase SQL Editor에서 아래 SQL 실행:

```sql
-- 시설물 테이블
CREATE TABLE IF NOT EXISTS facilities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  description TEXT,
  image_url TEXT,
  min_people INT DEFAULT 1,
  max_people INT DEFAULT 100,
  features JSONB DEFAULT '{}',
  open_time TEXT DEFAULT '09:00',
  close_time TEXT DEFAULT '22:00',
  closed_days INT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 예약 테이블
CREATE TABLE IF NOT EXISTS reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending',
  purpose TEXT,
  attendees INT DEFAULT 1,
  applicant_name TEXT NOT NULL,
  applicant_phone TEXT NOT NULL,
  applicant_email TEXT,
  applicant_dept TEXT,
  notes TEXT,
  qr_code TEXT UNIQUE,
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 관리자 테이블
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 관리자 세션 테이블
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  admin_id UUID,
  expires_at TIMESTAMPTZ NOT NULL,
  remember_me BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  department TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 사용자 세션 테이블
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 공지사항 테이블
CREATE TABLE IF NOT EXISTS notices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  is_pinned BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 리뷰 테이블
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  reservation_id UUID,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  content TEXT,
  author_name TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 대기열 테이블
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  applicant_name TEXT NOT NULL,
  applicant_phone TEXT NOT NULL,
  applicant_email TEXT,
  status TEXT DEFAULT 'waiting',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 휴일 테이블
CREATE TABLE IF NOT EXISTS holidays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 즐겨찾기 테이블
CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  user_identifier TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(facility_id, user_identifier)
);

-- RLS 정책 설정
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- 모든 테이블에 대해 전체 접근 허용 (개발용)
CREATE POLICY "Allow all" ON facilities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON reservations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON admins FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON admin_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON user_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON notices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON reviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON waitlist FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON holidays FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON favorites FOR ALL USING (true) WITH CHECK (true);

-- 기본 관리자 계정 추가 (비밀번호: 1234)
INSERT INTO admins (username, password_hash, name, role) 
VALUES ('admin', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', '관리자', 'super_admin')
ON CONFLICT (username) DO NOTHING;
```

## 🔑 기본 계정

### 관리자
- **URL**: /admin/login
- **아이디**: admin
- **비밀번호**: 1234

## ✨ 기능 목록

### 사용자 기능
- 🏢 시설물 목록 조회
- 📅 캘린더 기반 예약 신청
- 📱 QR 코드 체크인
- 📋 내 예약 조회/수정/취소
- ⭐ 시설물 즐겨찾기
- ⏰ 대기열 등록
- 💬 리뷰 작성
- 👤 회원가입/로그인

### 관리자 기능
- 📊 대시보드 통계
- 🏢 시설물 관리 (CRUD)
- 📅 예약 관리 (승인/거절/취소)
- 👥 관리자 계정 관리
- 📢 공지사항 관리
- 🗓️ 휴일 관리
- ⭐ 리뷰 관리
- ⏰ 대기열 관리
- 📋 활동 로그
- ⚙️ 시스템 설정

## 📁 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── admin/              # 관리자 페이지
│   ├── api/                # API 라우트
│   ├── auth/               # 로그인/회원가입
│   ├── checkin/            # QR 체크인
│   ├── facilities/         # 시설물 상세
│   └── reservation/        # 예약 조회
├── components/             # React 컴포넌트
└── lib/                    # 유틸리티
```

## 📞 문의

- **기관**: 계룡대학습관
- **주소**: 충남 계룡시 신도안3길 72
- **전화**: 042-551-1543
- **이메일**: pik8241@konyang.ac.kr

---

Copyrightⓒ bbusilleon 2026. All Rights Reserved.
