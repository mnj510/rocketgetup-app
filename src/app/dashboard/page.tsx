"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getMembers, getWakeupLogs, getMustRecord } from "@/lib/supabase-utils";

type DayStatus = "success" | "fail" | "none";

interface Member {
  id: string;
  code: string;
  name: string;
  is_admin: boolean;
}

interface WakeupLog {
  id: string;
  member_code: string;
  date: string;
  status: 'success' | 'fail';
}

interface MustRecord {
  id: string;
  member_code: string;
  date: string;
  priorities: string[];
  frogs: string[];
  retro: string;
}

export default function DashboardPage() {
  const [name, setName] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [memberCode, setMemberCode] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [members, setMembers] = useState<Member[]>([]);
  const [wakeupLogs, setWakeupLogs] = useState<WakeupLog[]>([]);
  const [loading, setLoading] = useState(true);

  const minSelectable = useMemo(() => new Date(2025, 8, 1), []); // 2025-09-01
  const currentMonthLabel = useMemo(() => selectedDate.toLocaleString("ko", { month: "long" }), [selectedDate]);

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        
        // 로컬 스토리지에서 사용자 정보 가져오기
        const code = localStorage.getItem("member_code");
        const admin = localStorage.getItem("is_admin") === "1";
        
        setMemberCode(code || "");
        setIsAdmin(admin);
        
        if (admin) {
          setName("관리자");
        } else if (code) {
          // 멤버 이름 설정
          const membersRaw = localStorage.getItem("members");
          if (membersRaw) {
            try {
              const memberList = JSON.parse(membersRaw) as Array<{ name: string; code: string }>;
              const found = memberList.find((m) => m.code === code);
              setName(found ? found.name : `멤버(${code})`);
            } catch {
              setName(`멤버(${code})`);
            }
          } else {
            setName(`멤버(${code})`);
          }
        } else {
          setName("게스트");
        }

        // Supabase에서 데이터 로드
        await loadSupabaseData();
      } catch (error) {
        console.error("데이터 초기화 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

  const loadSupabaseData = async () => {
    try {
      // 멤버 목록 로드
      const membersData = await getMembers();
      setMembers(membersData);
      
      // 로컬 스토리지에 멤버 정보 저장 (기존 코드와의 호환성)
      localStorage.setItem("members", JSON.stringify(membersData));
      
      // 기상 로그 로드
      if (memberCode) {
        const logs = await getWakeupLogs(
          memberCode, 
          selectedDate.getFullYear(), 
          selectedDate.getMonth() + 1
        );
        setWakeupLogs(logs);
      }
    } catch (error) {
      console.error("Supabase 데이터 로드 실패:", error);
    }
  };

  // 월간 통계 계산
  const monthlyStats = useMemo(() => {
    if (!memberCode) return { success: 0, fail: 0, rate: 0 };
    
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const logs = wakeupLogs.filter(log => {
      const logDate = new Date(log.date);
      return logDate.getFullYear() === year && logDate.getMonth() + 1 === month;
    });
    
    const success = logs.filter(log => log.status === 'success').length;
    const fail = logs.filter(log => log.status === 'fail').length;
    const total = success + fail;
    const rate = total === 0 ? 0 : Math.round((success / total) * 100);
    
    return { success, fail, total, rate };
  }, [memberCode, selectedDate, wakeupLogs]);

  // 관리자 월간 통계
  const adminMonthStats = useMemo(() => {
    if (!isAdmin) return { success: 0, fail: 0, successPct: 0, failPct: 0 };
    
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const logs = wakeupLogs.filter(log => {
      const logDate = new Date(log.date);
      return logDate.getFullYear() === year && logDate.getMonth() + 1 === month;
    });
    
    const success = logs.filter(log => log.status === 'success').length;
    const fail = logs.filter(log => log.status === 'fail').length;
    const total = success + fail;
    const successPct = total === 0 ? 0 : Math.round((success / total) * 100);
    const failPct = total === 0 ? 0 : 100 - successPct;
    
    return { success, fail, successPct, failPct };
  }, [isAdmin, selectedDate, wakeupLogs]);

  // 월간 일수/요일 헤더 생성
  const monthMeta = useMemo(() => {
    const base = new Date(selectedDate);
    const y = base.getFullYear();
    const m = base.getMonth();
    const days = new Date(y, m + 1, 0).getDate();
    const headers = new Array(days).fill(null).map((_, i) => {
      const d = new Date(y, m, i + 1);
      const weekday = new Intl.DateTimeFormat("ko", { weekday: "short" }).format(d);
      return { day: i + 1, weekday };
    });
    return { year: y, month: m + 1, days, headers };
  }, [selectedDate]);

  // 멤버별 월간 현황
  const memberMonthGrid = useMemo(() => {
    return members.map((member) => ({
      name: member.name,
      code: member.code,
      days: new Array(monthMeta.days).fill(null).map((_, i) => {
        const ymd = `${monthMeta.year}-${String(monthMeta.month).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
        const log = wakeupLogs.find(l => l.member_code === member.code && l.date === ymd);
        return log ? log.status : 'none';
      }),
    }));
  }, [members, monthMeta, wakeupLogs]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <div className="mt-4 text-gray-600">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 lg:mb-0">
          대시보드 - {name}
        </h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/wakeup" className="btn-primary text-center">
            기상 체크
          </Link>
          <Link href="/must/write" className="btn-gradient text-center">
            MUST 작성
          </Link>
          {isAdmin && (
            <Link href="/admin" className="btn-primary text-center">
              관리
            </Link>
          )}
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="gradient-box p-6 rounded-2xl flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl opacity-90">이번 달</div>
            <div className="text-5xl font-extrabold mt-1">{currentMonthLabel}</div>
          </div>
        </div>
        <div className="gradient-box p-6 rounded-2xl flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl opacity-90">
              {isAdmin ? '기상 성공률' : '기상 성공'}
            </div>
            <div className="text-5xl font-extrabold mt-1">
              {isAdmin ? `${adminMonthStats.successPct}%` : monthlyStats.success}
            </div>
          </div>
        </div>
        <div className="gradient-box p-6 rounded-2xl flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl opacity-90">
              {isAdmin ? '기상 실패률' : '기상률'}
            </div>
            <div className="text-5xl font-extrabold mt-1">
              {isAdmin ? `${adminMonthStats.failPct}%` : `${monthlyStats.rate}%`}
            </div>
            {!isAdmin && (
              <div className="mt-1 text-sm text-gray-100/80">
                성공/실패 {monthlyStats.success}/{monthlyStats.fail}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 내 월별 현황 (관리자는 숨김) */}
      {!isAdmin && memberCode && (
        <section className="card card-padding rounded-2xl mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <h2 className="font-semibold text-lg mb-3 sm:mb-0">
              내 월별 기상 현황 ({currentMonthLabel})
            </h2>
            <input
              type="month"
              className="rounded border px-3 py-2 w-full sm:w-auto"
              value={`${monthMeta.year}-${String(monthMeta.month).padStart(2, '0')}`}
              min={`2025-09`}
              onChange={(e) => {
                const [yy, mm] = e.target.value.split('-').map(Number);
                const next = new Date(yy, (mm || 1) - 1, 1);
                if (next < minSelectable) {
                  setSelectedDate(minSelectable);
                } else {
                  setSelectedDate(next);
                }
              }}
            />
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {monthMeta.headers.map((h) => (
                    <th key={h.day} className="px-1 text-center align-bottom whitespace-nowrap">
                      <div className="text-gray-500">{h.weekday}</div>
                      <div className="font-medium">{h.day}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {(() => {
                    const days = new Array(monthMeta.days).fill(null).map((_, i) => {
                      const ymd = `${monthMeta.year}-${String(monthMeta.month).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
                      const log = wakeupLogs.find(l => l.member_code === memberCode && l.date === ymd);
                      return log ? log.status : 'none';
                    });
                    
                    return days.map((state, idx) => (
                      <td key={idx} className="px-1 text-center">
                        {state === 'none' ? (
                          <span className="inline-block h-4 w-4 rounded border border-gray-300 bg-transparent"></span>
                        ) : (
                          <span className={`inline-block h-4 w-4 rounded ${
                            state === 'success' ? 'bg-blue-500' : 'bg-red-500'
                          }`}></span>
                        )}
                      </td>
                    ));
                  })()}
                </tr>
              </tbody>
            </table>
          </div>
          
          <p className="text-sm text-gray-600 mt-3">
            이번 달 나의 기상 완료: <span className="text-blue-600 font-semibold">{monthlyStats.success}</span>회 / 
            실패: <span className="text-red-600 font-semibold">{monthlyStats.fail}</span>회
          </p>
        </section>
      )}

      {/* 멤버별 월간 현황 */}
      <section className="card card-padding rounded-2xl mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <h2 className="font-semibold text-lg mb-3 sm:mb-0">
            {currentMonthLabel} 멤버별 기상 현황
          </h2>
          {isAdmin && (
            <input
              type="month"
              className="rounded border px-3 py-2 w-full sm:w-auto"
              value={`${monthMeta.year}-${String(monthMeta.month).padStart(2, '0')}`}
              min={`2025-09`}
              onChange={(e) => {
                const [yy, mm] = e.target.value.split('-').map(Number);
                const next = new Date(yy, (mm || 1) - 1, 1);
                if (next < minSelectable) {
                  setSelectedDate(minSelectable);
                } else {
                  setSelectedDate(next);
                }
              }}
            />
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left w-36 align-bottom">멤버</th>
                {monthMeta.headers.map((h) => (
                  <th key={h.day} className="px-1 text-center align-bottom whitespace-nowrap">
                    <div className="text-gray-500">{h.weekday}</div>
                    <div className="font-medium">{h.day}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {memberMonthGrid.map((row) => (
                <tr key={row.name} className={row.name === name ? 'text-red-600 font-semibold' : ''}>
                  <td className="py-2 pr-2 font-medium whitespace-nowrap">{row.name}</td>
                  {row.days.map((state, idx) => (
                    <td key={idx} className="px-1 text-center">
                      {state === 'none' ? (
                        <span className="inline-block h-4 w-4 rounded border border-gray-300 bg-transparent"></span>
                      ) : (
                        <span className={`inline-block h-4 w-4 rounded ${
                          state === 'success' ? 'bg-blue-500' : 'bg-red-500'
                        }`}></span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <p className="text-sm text-gray-600 mt-3">파랑: 성공, 빨강: 실패</p>
      </section>

      {/* 멤버별 점수 순위 */}
      <section className="card card-padding rounded-2xl">
        <div className="mb-4">
          <h2 className="font-semibold text-lg">멤버별 점수 순위 ({currentMonthLabel})</h2>
        </div>
        
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
              {(() => {
                // 점수 계산 (간단한 구현)
                const scores = members.map(member => {
                  const memberLogs = wakeupLogs.filter(log => 
                    log.member_code === member.code &&
                    new Date(log.date).getFullYear() === selectedDate.getFullYear() &&
                    new Date(log.date).getMonth() + 1 === selectedDate.getMonth() + 1
                  );
                  
                  const success = memberLogs.filter(log => log.status === 'success').length;
                  const fail = memberLogs.filter(log => log.status === 'fail').length;
                  const total = success + fail;
                  const rate = total === 0 ? 0 : Math.round((success / total) * 100);
                  
                  return {
                    name: member.name,
                    code: member.code,
                    score: rate,
                    success,
                    fail
                  };
                }).sort((a, b) => b.score - a.score);
                
                return scores.map((member, index) => (
                  <tr key={member.name} className={member.name === name ? 'text-red-600 font-semibold' : ''}>
                    <td className="py-2">{index + 1}위</td>
                    <td className="py-2 font-medium">{member.name}</td>
                    <td className="py-2 text-center">{member.score}%</td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}


