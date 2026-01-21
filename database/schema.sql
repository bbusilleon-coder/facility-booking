-- =====================================================
-- 시설물 예약 시스템 - 데이터베이스 스키마
-- =====================================================

-- 1. 시설물 테이블 (기존 + 운영시간 컬럼 추가)
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS open_time TEXT DEFAULT '09:00';
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS close_time TEXT DEFAULT '22:00';
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS closed_days INTEGER[] DEFAULT '{}';

-- 2. 관리자 설정 테이블 (신규)
CREATE TABLE IF NOT EXISTS admin_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 관리자 세션 테이블 (신규)
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  remember_me BOOLEAN DEFAULT false
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);

-- RLS 정책 (개발용 - 모든 접근 허용)
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on admin_settings" ON admin_settings;
DROP POLICY IF EXISTS "Allow all on admin_sessions" ON admin_sessions;

CREATE POLICY "Allow all on admin_settings" ON admin_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on admin_sessions" ON admin_sessions FOR ALL USING (true) WITH CHECK (true);

-- 초기 관리자 비밀번호 설정 (1234의 SHA-256 해시)
INSERT INTO admin_settings (key, value, updated_at) 
VALUES ('admin_password', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', NOW())
ON CONFLICT (key) DO NOTHING;
