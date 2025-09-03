-- 멤버 데이터 보호 및 안전한 삭제를 위한 Supabase 정책 강화

-- 1. 멤버 테이블에 삭제 방지 트리거 추가
CREATE OR REPLACE FUNCTION prevent_admin_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- 관리자 계정 삭제 방지
  IF OLD.is_admin = true THEN
    RAISE EXCEPTION '관리자 계정은 삭제할 수 없습니다.';
  END IF;
  
  -- 최소 1명의 관리자는 항상 존재해야 함
  IF OLD.is_admin = false AND (
    SELECT COUNT(*) FROM members WHERE is_admin = true
  ) <= 1 THEN
    RAISE EXCEPTION '최소 1명의 관리자는 항상 존재해야 합니다.';
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS prevent_admin_deletion_trigger ON members;
CREATE TRIGGER prevent_admin_deletion_trigger
  BEFORE DELETE ON members
  FOR EACH ROW
  EXECUTE FUNCTION prevent_admin_deletion();

-- 2. 멤버 코드 변경 방지 (데이터 무결성 보장)
CREATE OR REPLACE FUNCTION prevent_member_code_change()
RETURNS TRIGGER AS $$
BEGIN
  -- 멤버 코드 변경 방지 (기존 데이터와의 연관성 유지)
  IF OLD.code != NEW.code THEN
    RAISE EXCEPTION '멤버 코드는 변경할 수 없습니다. 데이터 무결성을 위해 새 멤버를 생성하세요.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS prevent_member_code_change_trigger ON members;
CREATE TRIGGER prevent_member_code_change_trigger
  BEFORE UPDATE ON members
  FOR EACH ROW
  EXECUTE FUNCTION prevent_member_code_change();

-- 3. 멤버 삭제 시 관련 데이터 자동 정리 함수
CREATE OR REPLACE FUNCTION cleanup_member_data()
RETURNS TRIGGER AS $$
BEGIN
  -- 멤버 삭제 시 관련 데이터 자동 정리
  DELETE FROM wakeup_logs WHERE member_code = OLD.code;
  DELETE FROM must_records WHERE member_code = OLD.code;
  DELETE FROM mobile_login_codes WHERE member_code = OLD.code;
  
  -- 로그 기록
  INSERT INTO system_logs (action, table_name, record_id, details, created_at)
  VALUES (
    'DELETE',
    'members',
    OLD.id,
    json_build_object(
      'member_code', OLD.code,
      'member_name', OLD.name,
      'deleted_at', NOW(),
      'related_data_cleaned', true
    ),
    NOW()
  );
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS cleanup_member_data_trigger ON members;
CREATE TRIGGER cleanup_member_data_trigger
  AFTER DELETE ON members
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_member_data();

-- 4. 시스템 로그 테이블 생성 (감사 추적용)
CREATE TABLE IF NOT EXISTS system_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id TEXT -- Supabase auth.uid() 연결 가능
);

-- 시스템 로그 인덱스
CREATE INDEX IF NOT EXISTS idx_system_logs_action ON system_logs(action);
CREATE INDEX IF NOT EXISTS idx_system_logs_table_name ON system_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);

-- 5. 멤버 데이터 백업 테이블 (삭제 전 자동 백업)
CREATE TABLE IF NOT EXISTS members_backup (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_id UUID NOT NULL,
  member_code TEXT NOT NULL,
  member_name TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  backup_created_at TIMESTAMPTZ DEFAULT NOW(),
  backup_reason TEXT DEFAULT '자동 백업'
);

-- 6. 멤버 삭제 전 자동 백업 트리거
CREATE OR REPLACE FUNCTION backup_member_before_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- 삭제 전 자동 백업
  INSERT INTO members_backup (
    original_id,
    member_code,
    member_name,
    is_admin,
    created_at,
    backup_reason
  ) VALUES (
    OLD.id,
    OLD.code,
    OLD.name,
    OLD.is_admin,
    OLD.created_at,
    '삭제 전 자동 백업'
  );
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS backup_member_before_deletion_trigger ON members;
CREATE TRIGGER backup_member_before_deletion_trigger
  BEFORE DELETE ON members
  FOR EACH ROW
  EXECUTE FUNCTION backup_member_before_deletion();

-- 7. 데이터 복구 함수 (필요시 사용)
CREATE OR REPLACE FUNCTION restore_member_from_backup(backup_id UUID)
RETURNS TEXT AS $$
DECLARE
  backup_record members_backup%ROWTYPE;
  new_member_id UUID;
BEGIN
  -- 백업 데이터 조회
  SELECT * INTO backup_record FROM members_backup WHERE id = backup_id;
  
  IF NOT FOUND THEN
    RETURN '백업 데이터를 찾을 수 없습니다.';
  END IF;
  
  -- 멤버 복구 (새 ID로)
  INSERT INTO members (code, name, is_admin, created_at)
  VALUES (
    backup_record.member_code || '_restored',
    backup_record.member_name || ' (복구됨)',
    backup_record.is_admin,
    NOW()
  ) RETURNING id INTO new_member_id;
  
  -- 백업 기록 업데이트
  UPDATE members_backup 
  SET backup_reason = '복구됨 - 새 ID: ' || new_member_id
  WHERE id = backup_id;
  
  RETURN '멤버가 성공적으로 복구되었습니다. 새 ID: ' || new_member_id;
END;
$$ LANGUAGE plpgsql;

-- 8. RLS 정책 강화
-- 멤버 테이블 RLS 활성화
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- 관리자만 멤버 삭제 가능
CREATE POLICY "Only admins can delete members" ON members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM members 
      WHERE code = current_setting('request.jwt.claims')::json->>'member_code'
      AND is_admin = true
    )
  );

-- 9. 테이블 정보 확인
SELECT 
  table_name,
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY table_name, trigger_name;

-- 10. 보안 설정 확인
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('members', 'wakeup_logs', 'must_records', 'mobile_login_codes');
