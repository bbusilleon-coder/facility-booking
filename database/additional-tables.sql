-- =====================================================
-- 시설물 예약 시스템 - 추가 기능 테이블 생성 SQL
-- Supabase SQL Editor에서 실행하세요!
-- =====================================================

-- 1. 공지사항 테이블
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

-- 2. 휴일 테이블
CREATE TABLE IF NOT EXISTS holidays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  name TEXT NOT NULL,
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  is_recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 관리자 활동 로그 테이블
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. reservations 테이블에 승인 관련 컬럼 추가 (없으면)
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS approved_by TEXT;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS admin_memo TEXT;

-- =====================================================
-- 인덱스 생성
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_notices_is_active ON notices(is_active);
CREATE INDEX IF NOT EXISTS idx_notices_is_pinned ON notices(is_pinned);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(date);
CREATE INDEX IF NOT EXISTS idx_holidays_facility_id ON holidays(facility_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at);

-- =====================================================
-- RLS (Row Level Security) 설정
-- =====================================================

-- notices
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on notices" ON notices;
CREATE POLICY "Allow all on notices" ON notices 
  FOR ALL USING (true) WITH CHECK (true);

-- holidays
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on holidays" ON holidays;
CREATE POLICY "Allow all on holidays" ON holidays 
  FOR ALL USING (true) WITH CHECK (true);

-- admin_logs
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on admin_logs" ON admin_logs;
CREATE POLICY "Allow all on admin_logs" ON admin_logs 
  FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- 테스트 데이터 (선택사항)
-- =====================================================

-- 테스트 공지사항
INSERT INTO notices (title, content, is_active, is_pinned)
VALUES 
  ('시스템 오픈 안내', '시설물 예약 시스템이 오픈되었습니다. 많은 이용 부탁드립니다.', true, true),
  ('예약 이용 안내', '예약은 최소 1일 전에 신청해주세요. 당일 예약은 관리자 승인이 필요합니다.', true, false);

-- =====================================================
-- 완료! 
-- 이제 시스템의 모든 기능을 사용할 수 있습니다.
-- =====================================================
