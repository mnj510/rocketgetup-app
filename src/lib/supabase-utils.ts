import { supabaseClient } from './supabase';

// 멤버 관련 함수
export async function getMembers() {
  const { data, error } = await supabaseClient
    .from('app.members')
    .select('*')
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

export async function addMember(code: string, name: string, isAdmin: boolean = false) {
  try {
    console.log("🔧 멤버 추가 시작:", { code, name, isAdmin });
    
    // Supabase 클라이언트 상태 확인
    if (!supabaseClient) {
      throw new Error("Supabase 클라이언트가 초기화되지 않았습니다.");
    }
    
    // 테이블 존재 확인
    const { data: tableCheck, error: tableError } = await supabaseClient
      .from('app.members')
      .select('id')
      .limit(1);
    
    if (tableError) {
      console.error("❌ 테이블 접근 오류:", tableError);
      throw new Error(`테이블 접근 실패: ${tableError.message}`);
    }
    
    console.log("✅ 테이블 접근 성공");
    
    // 멤버 추가
    const { data, error } = await supabaseClient
      .from('app.members')
      .insert([{ 
        code: code.trim(), 
        name: name.trim(), 
        is_admin: isAdmin 
      }])
      .select()
      .single();
    
    if (error) {
      console.error("❌ Supabase INSERT 오류:", error);
      
      // 중복 코드 오류 처리
      if (error.code === '23505') {
        throw new Error("이미 존재하는 멤버 코드입니다.");
      }
      
      // 기타 오류
      throw new Error(`데이터베이스 오류: ${error.message}`);
    }
    
    console.log("✅ 멤버 추가 성공:", data);
    return data;
    
  } catch (error) {
    console.error("❌ addMember 함수 오류:", error);
    throw error;
  }
}

// 기상 기록 관련 함수
export async function getWakeupLogs(memberCode: string, year: number, month: number) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
  
  const { data, error } = await supabaseClient
    .from('app.wakeup_logs')
    .select('*')
    .eq('member_code', memberCode)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

export async function addWakeupLog(memberCode: string, date: string, status: 'success' | 'fail', note?: string) {
  const { data, error } = await supabaseClient
    .from('app.wakeup_logs')
    .upsert([{ member_code: memberCode, date, status, note }], { onConflict: 'member_code,date' })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// MUST 기록 관련 함수
export async function getMustRecord(memberCode: string, date: string) {
  const { data, error } = await supabaseClient
    .from('app.must_records')
    .select('*')
    .eq('member_code', memberCode)
    .eq('date', date)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
  return data;
}

export async function saveMustRecord(memberCode: string, date: string, priorities: string[], frogs: string[], retro: string) {
  const { data, error } = await supabaseClient
    .from('app.must_records')
    .upsert([{ 
      member_code: memberCode, 
      date, 
      priorities, 
      frogs, 
      retro 
    }], { onConflict: 'member_code,date' })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteMustRecord(recordId: string) {
  const { error } = await supabaseClient
    .from('app.must_records')
    .delete()
    .eq('id', recordId);
  
  if (error) throw error;
  return true;
}

// 통계 계산 함수
export async function getMonthlyStats(memberCode: string, year: number, month: number) {
  const logs = await getWakeupLogs(memberCode, year, month);
  const success = logs.filter(log => log.status === 'success').length;
  const fail = logs.filter(log => log.status === 'fail').length;
  const total = success + fail;
  const rate = total === 0 ? 0 : Math.round((success / total) * 100);
  
  return { success, fail, total, rate };
}

export async function getAllMembersMonthlyStats(year: number, month: number) {
  const members = await getMembers();
  const stats = await Promise.all(
    members.map(async (member) => {
      const memberStats = await getMonthlyStats(member.code, year, month);
      return { ...member, ...memberStats };
    })
  );
  
  return stats;
}
