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
  const { data, error } = await supabaseClient
    .from('app.members')
    .insert([{ code, name, is_admin: isAdmin }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
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
