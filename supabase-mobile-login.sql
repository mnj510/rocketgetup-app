-- 모바일 로그인 코드 테이블 생성
CREATE TABLE IF NOT EXISTS mobile_login_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_code TEXT NOT NULL REFERENCES members(code) ON DELETE CASCADE,
  mobile_code TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_mobile_login_codes_mobile_code ON mobile_login_codes(mobile_code);
CREATE INDEX IF NOT EXISTS idx_mobile_login_codes_member_code ON mobile_login_codes(member_code);
CREATE INDEX IF NOT EXISTS idx_mobile_login_codes_expires_at ON mobile_login_codes(expires_at);

-- RLS 정책 설정
ALTER TABLE mobile_login_codes ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽을 수 있도록 정책 설정 (코드 검증용)
CREATE POLICY "Allow read access to mobile login codes" ON mobile_login_codes
  FOR SELECT USING (true);

-- 인증된 사용자만 생성/수정할 수 있도록 정책 설정
CREATE POLICY "Allow authenticated users to manage mobile login codes" ON mobile_login_codes
  FOR ALL USING (auth.role() = 'authenticated');

-- 만료된 코드 자동 삭제를 위한 함수 (선택사항)
CREATE OR REPLACE FUNCTION cleanup_expired_mobile_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM mobile_login_codes WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 매일 자정에 만료된 코드 정리 (선택사항)
-- SELECT cron.schedule('cleanup-expired-mobile-codes', '0 0 * * *', 'SELECT cleanup_expired_mobile_codes();');

-- 테이블 정보 확인
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'mobile_login_codes'
ORDER BY ordinal_position;
