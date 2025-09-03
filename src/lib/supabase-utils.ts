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

export async function generateMobileLoginCode(memberCode: string): Promise<string> {
  try {
    console.log("🔧 모바일 로그인 코드 생성 시작:", { memberCode });
    
    // 6자리 랜덤 코드 생성
    const mobileCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Supabase에 모바일 로그인 코드 저장 (24시간 유효)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    const { error } = await supabaseClient
      .from('mobile_login_codes')
      .upsert({
        member_code: memberCode,
        mobile_code: mobileCode,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      }, {
        onConflict: 'member_code'
      });
    
    if (error) {
      console.error("❌ 모바일 로그인 코드 저장 실패:", error);
      throw error;
    }
    
    console.log("✅ 모바일 로그인 코드 생성 성공:", mobileCode);
    return mobileCode;
  } catch (error) {
    console.error("❌ 모바일 로그인 코드 생성 실패:", error);
    throw error;
  }
}

export async function verifyMobileLoginCode(mobileCode: string): Promise<{ success: boolean; memberCode?: string; memberName?: string; error?: string }> {
  try {
    console.log("🔧 모바일 로그인 코드 검증 시작:", { mobileCode });
    
    const { data, error } = await supabaseClient
      .from('mobile_login_codes')
      .select('member_code, member_name, expires_at')
      .eq('mobile_code', mobileCode)
      .single();
    
    if (error) {
      console.error("❌ 모바일 로그인 코드 검증 오류:", error);
      throw error;
    }

    if (!data) {
      console.log("❌ 모바일 로그인 코드 검증 실패: 코드를 찾을 수 없습니다.");
      return { success: false, error: "코드를 찾을 수 없습니다." };
    }

    const now = new Date();
    const expiresAt = new Date(data.expires_at);

    if (now > expiresAt) {
      console.log("❌ 모바일 로그인 코드 검증 실패: 코드가 만료되었습니다.");
      return { success: false, error: "코드가 만료되었습니다." };
    }

    console.log("✅ 모바일 로그인 코드 검증 성공:", data);
    return { success: true, memberCode: data.member_code, memberName: data.member_name };
  } catch (error) {
    console.error("❌ verifyMobileLoginCode 함수 오류:", error);
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

export async function addWakeupLog(
  memberCode: string,
  date: string,
  wakeupStatus: "success" | "fail",
  frogStatus: "completed" | "not_completed",
  wakeupTime?: string,
  frogTime?: string,
  note?: string
): Promise<void> {
  try {
    console.log("🔧 기상 로그 추가 시작:", {
      memberCode,
      date,
      wakeupStatus,
      frogStatus,
      wakeupTime,
      frogTime,
      note
    });

    const { error } = await supabaseClient
      .from('wakeup_logs')
      .upsert({
        member_code: memberCode,
        date: date,
        wakeup_status: wakeupStatus,
        frog_status: frogStatus,
        wakeup_time: wakeupTime,
        frog_time: frogTime,
        note: note,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'member_code,date'
      });

    if (error) {
      console.error("❌ 기상 로그 추가 실패:", error);
      throw new Error(`기상 로그 추가 실패: ${error.message}`);
    }

    console.log("✅ 기상 로그 추가 성공");
  } catch (error) {
    console.error("❌ 기상 로그 추가 중 오류:", error);
    throw error;
  }
}

// MUST 기록 관련 함수
export async function getMustRecord(memberCode: string, date: string) {
  try {
    const { data, error } = await supabaseClient
      .from('must_records')
      .select('*')
      .eq('member_code', memberCode)
      .eq('date', date)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
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
    const success = logs.filter(log => log.wakeup_status === 'success').length;
    const fail = logs.filter(log => log.wakeup_status === 'fail').length;
    const total = success + fail;
    const rate = total === 0 ? 0 : Math.round((success / total) * 100);
    
    // MUST 기록도 함께 가져오기
    const mustRecords = [];
    const daysInMonth = new Date(year, month, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const mustRecord = await getMustRecord(memberCode, date);
      if (mustRecord) {
        mustRecords.push({
          ...mustRecord,
          completed: mustRecord.priorities && mustRecord.priorities.some((p: string) => p.trim())
        });
      }
    }
    
    return { success, fail, total, rate, logs, mustRecords };
  } catch (error) {
    console.error("❌ getMonthlyStats 실패:", error);
    return { success: 0, fail: 0, total: 0, rate: 0, logs: [], mustRecords: [] };
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
