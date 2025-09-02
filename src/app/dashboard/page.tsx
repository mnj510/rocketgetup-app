"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMembers, getMonthlyStats, getWakeupLogs, getMustRecord } from "@/lib/supabase-utils";
import { supabaseClient } from "@/lib/supabase";

interface Member {
  id: string;
  code: string;
  name: string;
  is_admin: boolean;
}

interface MemberStats {
  member: Member;
  success: number;
  fail: number;
  total: number;
  rate: number;
  score: number;
}

interface DailyStatus {
  date: string;
  wakeup: 'success' | 'fail' | null;
  must: boolean;
  frog: boolean;
}

interface MemberScore {
  name: string;
  code: string;
  score: number;
  rank: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [memberCode, setMemberCode] = useState("");
  const [memberName, setMemberName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberStats, setMemberStats] = useState<MemberStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailyStatuses, setDailyStatuses] = useState<Record<string, DailyStatus>>({});
  const [memberScores, setMemberScores] = useState<MemberScore[]>([]);

  useEffect(() => {
    const code = localStorage.getItem("member_code");
    const admin = localStorage.getItem("is_admin") === "true";
    
    if (!code && !admin) {
      router.push("/login");
      return;
    }

    setMemberCode(code || "");
    setIsAdmin(admin);
    
    if (code) {
      getMemberName(code);
    }
    
    loadDashboardData();
  }, [router, selectedDate]);

  const getMemberName = async (code: string) => {
    try {
      const { data, error } = await supabaseClient
        .from('members')
        .select('name')
        .eq('code', code)
        .single();
      
      if (!error && data) {
        setMemberName(data.name);
      }
    } catch (error) {
      console.error("멤버 이름 가져오기 실패:", error);
    }
  };

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // 모든 멤버 가져오기
      const allMembers = await getMembers();
      setMembers(allMembers);
      
      // 선택된 월의 데이터 로드
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;
      
      // 각 멤버의 통계 및 점수 계산
      const stats = await Promise.all(
        allMembers.map(async (member) => {
          const stats = await getMonthlyStats(member.code, year, month);
          
          // 점수 계산: 기상 + MUST + 개구리
          const score = await calculateMemberScore(member.code, year, month);
          
          return {
            member,
            ...stats,
            score
          };
        })
      );
      
      setMemberStats(stats);
      
      // 일별 상태 로드 (현재 사용자)
      if (memberCode) {
        await loadDailyStatuses(memberCode, year, month);
      }
      
      // 멤버별 점수 순위 계산
      calculateMemberScores(stats);
      
    } catch (error) {
      console.error("대시보드 데이터 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMemberScore = async (code: string, year: number, month: number): Promise<number> => {
    try {
      let totalScore = 0;
      
      // 해당 월의 일수 계산
      const daysInMonth = new Date(year, month, 0).getDate();
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // 기상 체크 점수 (04:59까지)
        const wakeupLog = await getWakeupLogs(code, year, month);
        if (wakeupLog && wakeupLog.length > 0) {
          const log = wakeupLog.find(l => l.date === date);
          if (log && log.status === 'success') {
            totalScore += 1;
          }
        }
        
        // MUST 작성 점수 (23:59까지)
        const mustRecord = await getMustRecord(code, date);
        if (mustRecord && mustRecord.priorities && mustRecord.priorities.some((p: string) => p.trim())) {
          totalScore += 1;
        }
        
        // 개구리 완료 점수 (23:59까지)
        if (mustRecord && mustRecord.frogs && mustRecord.frogs.some((f: string) => f.trim())) {
          totalScore += 1;
        }
      }
      
      return totalScore;
    } catch (error) {
      console.error("점수 계산 실패:", error);
      return 0;
    }
  };

  const calculateMemberScores = (stats: MemberStats[]) => {
    const scores: MemberScore[] = stats.map(stat => ({
      name: stat.member.name,
      code: stat.member.code,
      score: stat.score,
      rank: 0
    }));
    
    // 점수별로 정렬
    scores.sort((a, b) => b.score - a.score);
    
    // 동일 점수는 같은 순위로 설정
    let currentRank = 1;
    let prevScore = -1;
    
    scores.forEach((score, index) => {
      if (score.score !== prevScore) {
        currentRank = index + 1;
      }
      score.rank = currentRank;
      prevScore = score.score;
    });
    
    setMemberScores(scores);
  };

  const loadDailyStatuses = async (code: string, year: number, month: number) => {
    try {
      const daysInMonth = new Date(year, month, 0).getDate();
      const statuses: Record<string, DailyStatus> = {};
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // 기상 체크 상태
        const wakeupLogs = await getWakeupLogs(code, year, month);
        let wakeupStatus: 'success' | 'fail' | null = null;
        if (wakeupLogs && wakeupLogs.length > 0) {
          const log = wakeupLogs.find(l => l.date === date);
          if (log) {
            wakeupStatus = log.status;
          }
        }
        
        // MUST 작성 상태
        const mustRecord = await getMustRecord(code, date);
        const mustCompleted = !!(mustRecord && mustRecord.priorities && mustRecord.priorities.some((p: string) => p.trim()));
        
        // 개구리 완료 상태
        const frogCompleted = !!(mustRecord && mustRecord.frogs && mustRecord.frogs.some((f: string) => f.trim()));
        
        statuses[date] = {
          date,
          wakeup: wakeupStatus,
          must: mustCompleted,
          frog: frogCompleted
        };
      }
      
      setDailyStatuses(statuses);
    } catch (error) {
      console.error("일별 상태 로드 실패:", error);
    }
  };

  const getMonthName = (month: number) => {
    const monthNames = [
      "1월", "2월", "3월", "4월", "5월", "6월",
      "7월", "8월", "9월", "10월", "11월", "12월"
    ];
    return monthNames[month - 1];
  };

  const getDayOfWeek = (date: string) => {
    const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
    const day = new Date(date).getDay();
    return dayNames[day];
  };

  const isFutureDate = (date: string) => {
    const today = new Date();
    const targetDate = new Date(date);
    return targetDate > today;
  };

  const getMemberDailyStatus = (memberCode: string, date: string) => {
    // 실제 구현에서는 해당 멤버의 해당 날짜 상태를 가져와야 함
    // 현재는 임시로 랜덤 상태 반환
    const random = Math.random();
    if (random > 0.7) return 'success';
    if (random > 0.4) return 'fail';
    return null;
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <div className="mt-2 text-gray-600">로딩 중...</div>
      </div>
    );
  }

  const currentYear = selectedDate.getFullYear();
  const currentMonth = selectedDate.getMonth() + 1;
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {isAdmin ? "관리자 대시보드" : `${memberName || memberCode}님의 대시보드`}
          </h1>
          <div className="flex items-center space-x-4">
            <input
              type="month"
              value={`${currentYear}-${String(currentMonth).padStart(2, '0')}`}
              onChange={(e) => {
                const [year, month] = e.target.value.split('-').map(Number);
                setSelectedDate(new Date(year, month - 1, 1));
              }}
              className="px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
        <p className="text-gray-600">
          {currentYear}년 {getMonthName(currentMonth)} 기상 현황
        </p>
      </div>

      {/* 통계 카드 */}
      {!isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">이번 달</h3>
            <p className="text-3xl font-bold text-indigo-600">
              {memberStats.find(s => s.member.code === memberCode)?.total || 0}일
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">기상 성공</h3>
            <p className="text-3xl font-bold text-green-600">
              {memberStats.find(s => s.member.code === memberCode)?.success || 0}일
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">기상률</h3>
            <p className="text-3xl font-bold text-blue-600">
              {memberStats.find(s => s.member.code === memberCode)?.rate || 0}%
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">총 점수</h3>
            <p className="text-3xl font-bold text-purple-600">
              {memberStats.find(s => s.member.code === memberCode)?.score || 0}점
            </p>
          </div>
        </div>
      )}

      {/* 1. 내 월별 기상 현황 */}
      {!isAdmin && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            내 월별 기상 현황 ({currentYear}년 {getMonthName(currentMonth)})
          </h2>
          
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["일", "월", "화", "수", "목", "금", "토"].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>
          
          {/* 달력 그리드 */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const date = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const status = dailyStatuses[date];
              const isFuture = isFutureDate(date);
              
              return (
                <div key={day} className="relative">
                  <div className={`h-12 flex items-center justify-center rounded-md text-sm font-medium ${
                    isFuture ? 'bg-gray-100 border border-gray-300' : 
                    status?.wakeup === 'success' ? 'bg-blue-500 text-white' :
                    status?.wakeup === 'fail' ? 'bg-red-500 text-white' :
                    'bg-gray-200 text-gray-700'
                  }`}>
                    {day}
                  </div>
                  
                  {/* 점수 표시 */}
                  {status && !isFuture && (
                    <div className="absolute -top-1 -right-1 text-xs bg-yellow-400 text-black rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {(status.wakeup ? 1 : 0) + (status.must ? 1 : 0) + (status.frog ? 1 : 0)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <span className="inline-block w-4 h-4 bg-blue-500 rounded mr-2"></span> 기상 성공
            <span className="inline-block w-4 h-4 bg-red-500 rounded ml-4 mr-2"></span> 기상 실패
            <span className="inline-block w-4 h-4 bg-gray-100 border border-gray-300 rounded ml-4 mr-2"></span> 미래/미완료
            <span className="inline-block w-5 h-5 bg-yellow-400 rounded ml-4 mr-2"></span> 일일 점수
          </div>
        </div>
      )}

      {/* 2. 멤버별 기상 현황 (좌측 멤버 목록 + 상단 요일/날짜) */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {currentYear}년 {getMonthName(currentMonth)} 멤버별 기상 현황
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left w-36 align-bottom pb-2">멤버</th>
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const date = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayOfWeek = getDayOfWeek(date);
                  
                  return (
                    <th key={day} className="px-1 text-center align-bottom whitespace-nowrap">
                      <div className="text-gray-500 text-xs">{dayOfWeek}</div>
                      <div className="font-medium">{day}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className={member.code === memberCode ? 'bg-blue-50' : ''}>
                  <td className="py-2 pr-2 font-medium whitespace-nowrap">
                    {member.name}
                    {member.code === memberCode && <span className="ml-2 text-blue-600">(나)</span>}
                  </td>
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const day = i + 1;
                    const date = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isFuture = isFutureDate(date);
                    const status = getMemberDailyStatus(member.code, date);
                    
                    return (
                      <td key={day} className="px-1 text-center">
                        {isFuture ? (
                          <span className="inline-block h-4 w-4 rounded border border-gray-300 bg-transparent"></span>
                        ) : status === 'success' ? (
                          <span className="inline-block h-4 w-4 rounded bg-blue-500"></span>
                        ) : status === 'fail' ? (
                          <span className="inline-block h-4 w-4 rounded bg-red-500"></span>
                        ) : (
                          <span className="inline-block h-4 w-4 rounded border border-gray-300 bg-transparent"></span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <span className="inline-block w-4 h-4 bg-blue-500 rounded mr-2"></span> 기상 성공
          <span className="inline-block w-4 h-4 bg-red-500 rounded ml-4 mr-2"></span> 기상 실패
          <span className="inline-block w-4 h-4 bg-gray-100 border border-gray-300 rounded ml-4 mr-2"></span> 미완료/미래
        </div>
      </div>

      {/* 3. 멤버별 점수 순위 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          멤버별 점수 순위 ({currentYear}년 {getMonthName(currentMonth)})
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="w-20 text-left">순위</th>
                <th className="text-left">멤버</th>
                <th className="w-24 text-center">점수</th>
              </tr>
            </thead>
            <tbody>
              {memberScores.map((member) => (
                <tr key={member.code} className={member.code === memberCode ? 'text-blue-600 font-semibold' : ''}>
                  <td className="py-2">{member.rank}위</td>
                  <td className="py-2 font-medium">
                    {member.name}
                    {member.code === memberCode && <span className="ml-2 text-blue-600">(나)</span>}
                  </td>
                  <td className="py-2 text-center font-bold">{member.score}점</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <span className="text-blue-600">파란색</span>으로 표시된 멤버는 현재 로그인한 사용자입니다.
        </div>
      </div>
    </div>
  );
}


