-- =====================================================
-- 추가 기능을 위한 테이블 (1~15번 기능)
-- Supabase SQL Editor에서 실행하세요!
-- =====================================================

-- 1. 사용자 테이블 (회원가입/로그인)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  department TEXT,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on users" ON users;
CREATE POLICY "Allow all on users" ON users FOR ALL USING (true) WITH CHECK (true);

-- 2. 즐겨찾기 테이블
CREATE TABLE IF NOT EXISTS favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_identifier TEXT NOT NULL,  -- 이메일 또는 전화번호
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_identifier, facility_id)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on favorites" ON favorites;
CREATE POLICY "Allow all on favorites" ON favorites FOR ALL USING (true) WITH CHECK (true);

-- 3. 예약 대기열 테이블
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  desired_date DATE NOT NULL,
  desired_start_time TIME NOT NULL,
  desired_end_time TIME NOT NULL,
  applicant_name TEXT NOT NULL,
  applicant_phone TEXT NOT NULL,
  applicant_email TEXT,
  status TEXT DEFAULT 'waiting',  -- waiting, notified, converted, expired
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on waitlist" ON waitlist;
CREATE POLICY "Allow all on waitlist" ON waitlist FOR ALL USING (true) WITH CHECK (true);

-- 4. 체크인 기록 테이블
CREATE TABLE IF NOT EXISTS checkins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID REFERENCES reservations(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  checked_out_at TIMESTAMPTZ,
  method TEXT DEFAULT 'qr'  -- qr, manual
);

ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on checkins" ON checkins;
CREATE POLICY "Allow all on checkins" ON checkins FOR ALL USING (true) WITH CHECK (true);

-- 5. 시설 이용 후기 테이블
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  reviewer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on reviews" ON reviews;
CREATE POLICY "Allow all on reviews" ON reviews FOR ALL USING (true) WITH CHECK (true);

-- 6. 알림 발송 기록 테이블
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,  -- email, sms, kakao
  recipient TEXT NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending',  -- pending, sent, failed
  related_type TEXT,  -- reservation, waitlist
  related_id UUID,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on notifications" ON notifications;
CREATE POLICY "Allow all on notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);

-- 7. 부서 테이블
CREATE TABLE IF NOT EXISTS departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on departments" ON departments;
CREATE POLICY "Allow all on departments" ON departments FOR ALL USING (true) WITH CHECK (true);

-- 8. 시설-부서 권한 테이블
CREATE TABLE IF NOT EXISTS facility_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(facility_id, department_id)
);

ALTER TABLE facility_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on facility_permissions" ON facility_permissions;
CREATE POLICY "Allow all on facility_permissions" ON facility_permissions FOR ALL USING (true) WITH CHECK (true);

-- 9. 시설물 테이블에 컬럼 추가
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS usage_guide TEXT;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS restriction_type TEXT DEFAULT 'none';  -- none, department_only

-- 10. 예약 테이블에 컬럼 추가
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS qr_code TEXT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS extended_count INTEGER DEFAULT 0;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS original_end_at TIMESTAMPTZ;

-- 11. 관리자 설정에 알림 설정 추가
INSERT INTO admin_settings (key, value) VALUES ('email_notifications', 'true') ON CONFLICT (key) DO NOTHING;
INSERT INTO admin_settings (key, value) VALUES ('admin_email', '') ON CONFLICT (key) DO NOTHING;
INSERT INTO admin_settings (key, value) VALUES ('smtp_host', '') ON CONFLICT (key) DO NOTHING;
INSERT INTO admin_settings (key, value) VALUES ('smtp_port', '587') ON CONFLICT (key) DO NOTHING;
INSERT INTO admin_settings (key, value) VALUES ('smtp_user', '') ON CONFLICT (key) DO NOTHING;
INSERT INTO admin_settings (key, value) VALUES ('smtp_pass', '') ON CONFLICT (key) DO NOTHING;
INSERT INTO admin_settings (key, value) VALUES ('dark_mode', 'dark') ON CONFLICT (key) DO NOTHING;

-- 기본 부서 추가
INSERT INTO departments (name) VALUES ('총무부') ON CONFLICT (name) DO NOTHING;
INSERT INTO departments (name) VALUES ('인사부') ON CONFLICT (name) DO NOTHING;
INSERT INTO departments (name) VALUES ('교육부') ON CONFLICT (name) DO NOTHING;
INSERT INTO departments (name) VALUES ('기획부') ON CONFLICT (name) DO NOTHING;
INSERT INTO departments (name) VALUES ('일반') ON CONFLICT (name) DO NOTHING;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_identifier);
CREATE INDEX IF NOT EXISTS idx_waitlist_facility ON waitlist(facility_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_date ON waitlist(desired_date);
CREATE INDEX IF NOT EXISTS idx_checkins_reservation ON checkins(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reviews_facility ON reviews(facility_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_reservations_user ON reservations(user_id);
