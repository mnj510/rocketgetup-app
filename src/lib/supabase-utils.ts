import { supabaseClient } from './supabase';

// 멤버 관련 함수
export async function getMembers() {
  try {
    console.log("🔧 getMembers 시작");
    
    const { data, error } = await supabaseClient
      .from('members')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error("❌ getMembers 오류:", error);
      throw error;
    }
    
    console.log("✅ getMembers 성공:", data);
    return data || [];
  } catch (error) {
    console.error("❌ getMembers 실패:", error);
    return [];
  }
}

export async function addMember(code: string, name: string, isAdmin: boolean = false) {
  try {
    console.log("🔧 멤버 추가 시작:", { code, name, isAdmin });
    
    // 입력값 검증
    if (!code || !name) {
      throw new Error("멤버 코드와 이름을 모두 입력해주세요.");
    }
    
    // Supabase 클라이언트 확인
    if (!supabaseClient) {
      throw new Error("Supabase 클라이언트가 초기화되지 않았습니다.");
    }
    
    console.log("🔧 Supabase 클라이언트 확인됨");
    
    // 연결 테스트 - 간단한 쿼리로
    console.log("🔧 연결 테스트 시작...");
    try {
      const testResult = await supabaseClient
        .from('members')
        .select('id')
        .limit(1);
      
      if (testResult.error) {
        console.error("❌ 연결 테스트 실패:", testResult.error);
        throw new Error(`연결 테스트 실패: ${testResult.error.message}`);
      }
      
      console.log("✅ 연결 테스트 성공");
    } catch (testError) {
      console.error("❌ 연결 테스트 중 오류:", testError);
      throw new Error(`연결 테스트 중 오류: ${testError}`);
    }
    
    // 멤버 추가
    console.log("🔧 멤버 추가 쿼리 실행...");
    const { data, error } = await supabaseClient
      .from('members')
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
  try {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
    
    const { data, error } = await supabaseClient
      .from('wakeup_logs')
      .select('*')
      .eq('member_code', memberCode)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("❌ getWakeupLogs 실패:", error);
    return [];
  }
}

export async function addWakeupLog(memberCode: string, date: string, status: 'success' | 'fail', note?: string) {
  try {
    const { data, error } = await supabaseClient
      .from('wakeup_logs')
      .upsert([{ member_code: memberCode, date, status, note }], { onConflict: 'member_code,date' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("❌ addWakeupLog 실패:", error);
    throw error;
  }
}

// MUST 기록 관련 함수
export async function getMustRecord(memberCode: string, date: string) {
  try {
    console.log("🔧 getMustRecord 시작:", { memberCode, date });
    
    // memberCode가 비어있으면 null 반환
    if (!memberCode || !memberCode.trim()) {
      console.log("⚠️ memberCode가 비어있음");
      return null;
    }
    
    const { data, error } = await supabaseClient
      .from('must_records')
      .select('*')
      .eq('member_code', memberCode.trim())
      .eq('date', date)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // 데이터가 없는 경우 (정상적인 상황)
        console.log("✅ getMustRecord: 해당 날짜에 MUST 기록 없음");
        return null;
      }
      console.error("❌ getMustRecord 에러:", error);
      throw error;
    }
    
    console.log("✅ getMustRecord 성공:", data);
    return data;
  } catch (error) {
    console.error("❌ getMustRecord 실패:", error);
    return null;
  }
}

export async function saveMustRecord(memberCode: string, date: string, priorities: string[], frogs: string[], retro: string) {
  try {
    const { data, error } = await supabaseClient
      .from('must_records')
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
  } catch (error) {
    console.error("❌ saveMustRecord 실패:", error);
    throw error;
  }
}

export async function deleteMustRecord(recordId: string) {
  try {
    const { error } = await supabaseClient
      .from('must_records')
      .delete()
      .eq('id', recordId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("❌ deleteMustRecord 실패:", error);
    throw error;
  }
}

// 통계 계산 함수
export async function getMonthlyStats(memberCode: string, year: number, month: number) {
  try {
    const logs = await getWakeupLogs(memberCode, year, month);
    const success = logs.filter(log => log.status === 'success').length;
    const fail = logs.filter(log => log.status === 'fail').length;
    const total = success + fail;
    const rate = total === 0 ? 0 : Math.round((success / total) * 100);
    
    return { success, fail, total, rate };
  } catch (error) {
    console.error("❌ getMonthlyStats 실패:", error);
    return { success: 0, fail: 0, total: 0, rate: 0 };
  }
}

export async function getAllMembersMonthlyStats(year: number, month: number) {
  try {
    const members = await getMembers();
    const stats = await Promise.all(
      members.map(async (member) => {
        const memberStats = await getMonthlyStats(member.code, year, month);
        return { ...member, ...memberStats };
      })
    );
    
    return stats;
  } catch (error) {
    console.error("❌ getAllMembersMonthlyStats 실패:", error);
    return [];
  }
}
