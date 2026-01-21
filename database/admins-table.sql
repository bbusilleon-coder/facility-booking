-- =====================================================
-- 관리자 다중 등록을 위한 테이블
-- Supabase SQL Editor에서 실행
-- =====================================================

-- 관리자 계정 테이블
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT DEFAULT 'admin', -- 'super_admin', 'admin', 'viewer'
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);
CREATE INDEX IF NOT EXISTS idx_admins_is_active ON admins(is_active);

-- RLS 정책
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on admins" ON admins;
CREATE POLICY "Allow all on admins" ON admins 
  FOR ALL USING (true) WITH CHECK (true);

-- 기본 슈퍼 관리자 계정 생성 (비밀번호: admin1234)
-- SHA-256 해시: 03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4 (1234)
INSERT INTO admins (username, password_hash, name, role)
VALUES ('admin', '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', '최고관리자', 'super_admin')
ON CONFLICT (username) DO NOTHING;

-- admin_sessions 테이블에 admin_id 컬럼 추가
ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES admins(id);
