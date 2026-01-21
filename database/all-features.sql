-- =====================================================
-- 시설물 예약 시스템 - 전체 추가 기능 테이블
-- Supabase SQL Editor에서 실행하세요!
-- =====================================================

-- =====================================================
-- 1. 기존 테이블 컬럼 추가
-- =====================================================

-- reservations 테이블 추가 컬럼
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS applicant_name TEXT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS applicant_phone TEXT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS applicant_email TEXT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS applicant_dept TEXT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS purpose TEXT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS attendees INTEGER DEFAULT 1;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS approved_by TEXT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS admin_memo TEXT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;

-- facilities 테이블 추가 컬럼
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS usage_guide TEXT;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS is_restricted BOOLEAN DEFAULT false;

-- =====================================================
-- 2. 관리자 테이블
-- =====================================================

CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on admins" ON admins;
CREATE POLICY "Allow all on admins" ON admins FOR ALL USING (true) WITH CHECK (true);

-- 기본 관리자 (admin / 1234)
INSERT INTO admins (username, password_hash, name, role)
VALUES ('admin', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', '최고관리자', 'super_admin')
ON CONFLICT (username) DO NOTHING;

-- admin_sessions 추가 컬럼
ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS admin_id UUID;

-- =====================================================
-- 3. 공지사항 테이블
-- =====================================================

CREATE TABLE IF NOT EXISTS notices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_pinned BOOLEAN DEFAULT false,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on notices" ON notices;
CREATE POLICY "Allow all on notices" ON notices FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- 4. 휴일 테이블
-- =====================================================

CREATE TABLE IF NOT EXISTS holidays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  name TEXT NOT NULL,
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  is_recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on holidays" ON holidays;
CREATE POLICY "Allow all on holidays" ON holidays FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- 5. 관리자 활동 로그 테이블
-- =====================================================

CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on admin_logs" ON admin_logs;
CREATE POLICY "Allow all on admin_logs" ON admin_logs FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- 6. 사용자 테이블 (회원가입)
-- =====================================================

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

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on users" ON users;
CREATE POLICY "Allow all on users" ON users FOR ALL USING (true) WITH CHECK (true);

-- 사용자 세션
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on user_sessions" ON user_sessions;
CREATE POLICY "Allow all on user_sessions" ON user_sessions FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- 7. 대기열 테이블
-- =====================================================

CREATE TABLE IF NOT EXISTS waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  desired_date DATE NOT NULL,
  desired_start_time TIME,
  desired_end_time TIME,
  applicant_name TEXT NOT NULL,
  applicant_phone TEXT NOT NULL,
  applicant_email TEXT,
  purpose TEXT,
  attendees INTEGER DEFAULT 1,
  status TEXT DEFAULT 'waiting', -- waiting, notified, cancelled, converted
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on waitlist" ON waitlist;
CREATE POLICY "Allow all on waitlist" ON waitlist FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- 8. 리뷰 테이블
-- =====================================================

CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT,
  author_name TEXT NOT NULL,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on reviews" ON reviews;
CREATE POLICY "Allow all on reviews" ON reviews FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- 9. 시설 권한 테이블 (부서별 제한)
-- =====================================================

CREATE TABLE IF NOT EXISTS facility_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  department TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE facility_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on facility_permissions" ON facility_permissions;
CREATE POLICY "Allow all on facility_permissions" ON facility_permissions FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- 인덱스 생성
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_reservations_checked_in ON reservations(checked_in_at);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_facility_date ON waitlist(facility_id, desired_date);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);
CREATE INDEX IF NOT EXISTS idx_reviews_facility ON reviews(facility_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_facility_permissions_facility ON facility_permissions(facility_id);

-- =====================================================
-- 완료!
-- =====================================================
