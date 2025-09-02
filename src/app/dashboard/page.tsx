"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type DayStatus = "success" | "fail" | "none";

interface MemberRow {
  name: string;
  week: DayStatus[]; // length 7
}

// 임시 더미 데이터: 추후 Supabase 데이터로 대체
function useDummyMonthlyStatuses(): Record<string, DayStatus> {
  const today = new Date();
  const days = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const statuses: Record<string, DayStatus> = {};
  for (let d = 1; d <= days; d += 1) {
    statuses[String(d)] = Math.random() > 0.5 ? "success" : "fail";
  }
  return statuses;
}

export default function DashboardPage() {
  const [name, setName] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [memberCode, setMemberCode] = useState<string>("");
  // 점수 섹션은 달력 형태로 바꿉니다(이전/다음 버튼 제거)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const minSelectable = useMemo(() => new Date(2025, 8, 1), []); // 2025-09-01
  const currentMonthLabel = useMemo(() => selectedDate.toLocaleString("ko", { month: "long" }), [selectedDate]);
  const statuses = useDummyMonthlyStatuses();

  useEffect(() => {
    const code = localStorage.getItem("member_code");
    setMemberCode(code || "");
    const admin = localStorage.getItem("is_admin") === "1";
    setIsAdmin(admin);
    if (admin) {
      setName("관리자");
    } else if (code) {
      // 코드→이름 매핑
      const membersRaw = localStorage.getItem("members");
      if (membersRaw) {
        try {
          const list = JSON.parse(membersRaw) as Array<{ name: string; code: string }>;
          const found = list.find((m) => m.code === code);
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
  }, []);

  const calendar = useMemo(() => {
    const base = new Date(selectedDate);
    const year = base.getFullYear();
    const month = base.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    return new Array(days).fill(null).map((_, i) => {
      const day = i + 1;
      const state = statuses[String(day)] ?? "none";
      const color = state === "success" ? "bg-blue-500" : state === "fail" ? "bg-red-500" : "bg-gray-200";
      return (
        <div key={day} className={`h-10 flex items-center justify-center rounded text-white ${color}`}>
          {day}
        </div>
      );
    });
  }, [statuses, selectedDate]);

  // 멤버별 주간 현황(데모): 임시 5명 × 7일 랜덤
  const weeklyBoard: MemberRow[] = useMemo(() => {
    // 멤버 목록은 로컬스토리지의 members를 사용(관리자 페이지에서 추가됨)
    let names = ["민수", "지영", "현우", "소라", "태훈"];
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("members");
        if (raw) {
          const list = JSON.parse(raw) as Array<{ name: string; code: string }>;
          if (list.length > 0) names = list.map((m) => m.name);
        }
      } catch {
        // ignore
      }
    }
    return names.map((n) => ({
      name: n,
      week: new Array(7).fill(null).map(() => (Math.random() > 0.5 ? "success" : "fail")),
    }));
  }, []);

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

  // 멤버 x 날짜 랜덤 현황(데모)
  const memberMonthGrid = useMemo(() => {
    const today = new Date();
    const membersRaw = typeof window !== 'undefined' ? localStorage.getItem('members') : null;
    const noHistoryMode = !!membersRaw; // 멤버를 새로 추가한 경우: 기록 없음 → 전부 빈칸
    return weeklyBoard.map((row) => ({
      name: row.name,
      days: new Array(monthMeta.days).fill(null).map((_, i) => {
        const d = new Date(monthMeta.year, monthMeta.month - 1, i + 1);
        if (noHistoryMode) return "none" as DayStatus; // 기록 없음
        // 미래 날짜는 빈칸 표시
        if (d > today) return "none" as DayStatus;
        return Math.random() > 0.5 ? ("success" as DayStatus) : ("fail" as DayStatus);
      }),
    }));
  }, [weeklyBoard, monthMeta.days, monthMeta.month, monthMeta.year]);

  const [adminQuery, setAdminQuery] = useState("");

  // 멤버(비관리자) 본인의 월간 성공/실패/성공률 계산
  const selfMonthStats = useMemo(() => {
    if (!memberCode) return { success: 0, fail: 0, rate: 0 };
    let succ = 0;
    let fail = 0;
    for (let i = 0; i < monthMeta.days; i++) {
      const ymd = `${monthMeta.year}-${String(monthMeta.month).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
      const k = `wake:${memberCode}:${ymd}`;
      const raw = typeof window !== 'undefined' ? localStorage.getItem(k) : null;
      if (!raw) continue;
      try {
        const rec = JSON.parse(raw);
        if (rec.status === 'success') succ += 1;
        if (rec.status === 'fail') fail += 1;
      } catch {}
    }
    const total = succ + fail;
    const rate = total === 0 ? 0 : Math.round((succ / total) * 100);
    return { success: succ, fail, rate };
  }, [memberCode, monthMeta.days, monthMeta.month, monthMeta.year]);
  const monthlyScores = useMemo(() => {
    // 점수는 LocalStorage에 누적된 MUST/WAKE 기반으로 계산
    const membersRaw = typeof window !== 'undefined' ? localStorage.getItem('members') : null;
    const memberList: Array<{ name: string; code: string }> = (() => {
      if (!membersRaw) return [];
      try { return JSON.parse(membersRaw); } catch { return []; }
    })();
    const ym = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}`;
    const rows = memberList.map((m) => {
      const key = `score:${m.code}:${ym}`;
      let scoreObj: any = { must: 0, wake: 0 };
      try { const raw = localStorage.getItem(key); if (raw) scoreObj = JSON.parse(raw); } catch {}
      const total = (scoreObj.must || 0) + (scoreObj.wake || 0);
      return { name: m.name, code: m.code, score: total };
    });
    const sorted = rows.sort((a, b) => b.score - a.score);
    let prevScore: number | null = null;
    let prevRank = 0;
    sorted.forEach((r, i) => {
      const rank = prevScore !== null && r.score === prevScore ? prevRank : i + 1;
      (r as any).rank = rank;
      prevScore = r.score;
      prevRank = rank;
    });
    return sorted as Array<typeof rows[number] & { rank: number }>;
  }, [selectedDate]);

  const adminMonthStats = useMemo(() => {
    if (!isAdmin) return { success: 0, fail: 0, successPct: 0, failPct: 0 };
    const membersRaw = typeof window !== 'undefined' ? localStorage.getItem('members') : null;
    let members: Array<{ name: string; code: string }> = [];
    try { if (membersRaw) members = JSON.parse(membersRaw); } catch {}
    let succ = 0;
    let fail = 0;
    for (const m of members) {
      for (let i = 0; i < monthMeta.days; i++) {
        const ymd = `${monthMeta.year}-${String(monthMeta.month).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`;
        const k = `wake:${m.code}:${ymd}`;
        const raw = typeof window !== 'undefined' ? localStorage.getItem(k) : null;
        if (raw) {
          try {
            const rec = JSON.parse(raw);
            if (rec.status === 'success') succ += 1;
            if (rec.status === 'fail') fail += 1;
          } catch {}
        }
      }
    }
    const total = succ + fail;
    const successPct = total === 0 ? 0 : Math.round((succ / total) * 100);
    const failPct = total === 0 ? 0 : 100 - successPct;
    return { success: succ, fail, successPct, failPct };
  }, [isAdmin, monthMeta.days, monthMeta.month, monthMeta.year]);

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="page-title">대시보드 - {name}</h1>
        <div className="space-x-2">
          <Link href="/wakeup" className="btn-primary">기상 체크</Link>
          <Link href="/must" className="btn-gradient">MUST 작성</Link>
          {isAdmin && (
            <Link href="/admin" className="btn-primary">관리</Link>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="gradient-box p-6 rounded-2xl flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl opacity-90">이번 달</div>
            <div className="text-5xl font-extrabold mt-1">{currentMonthLabel}</div>
          </div>
        </div>
        <div className="gradient-box p-6 rounded-2xl flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl opacity-90">{isAdmin ? '기상 성공률' : '기상 성공'}</div>
            <div className="text-5xl font-extrabold mt-1">{isAdmin ? `${adminMonthStats.successPct}%` : selfMonthStats.success}</div>
          </div>
        </div>
        <div className="gradient-box p-6 rounded-2xl flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl opacity-90">{isAdmin ? '기상 실패률' : '기상률'}</div>
            <div className="text-5xl font-extrabold mt-1">{isAdmin ? `${adminMonthStats.failPct}%` : `${selfMonthStats.rate}%`}</div>
            {!isAdmin && (
              <div className="mt-1 text-sm text-gray-100/80">성공/실패 {selfMonthStats.success}/{selfMonthStats.fail}</div>
            )}
          </div>
        </div>
      </div>

      {/* 내 월별 현황 (관리자는 숨김) */}
      {!isAdmin && (
      <section className="card card-padding rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">내 월별 기상 현황 ({currentMonthLabel})</h2>
          <input
            type="month"
            className="rounded border px-3 py-2"
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
        {(() => {
          const successCnt = selfMonthStats.success;
          const failCnt = selfMonthStats.fail;
          return (
            <>
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
                      {self.days.map((state, idx) => (
                        <td key={idx} className="px-1 text-center">
                          {state === 'none' ? (
                            <span className="inline-block h-4 w-4 rounded border border-gray-300 bg-transparent"></span>
                          ) : (
                            <span className={`inline-block h-4 w-4 rounded ${state === 'success' ? 'bg-blue-500' : 'bg-red-500'}`}></span>
                          )}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-gray-600 mt-3">이번 달 나의 기상 완료: <span className="text-blue-600 font-semibold">{successCnt}</span>회 / 실패: <span className="text-red-600 font-semibold">{failCnt}</span>회</p>
            </>
          );
        })()}
      </section>
      )}

      {/* 멤버별 월간 현황 (달력으로 월 변경 가능) */}
      <section className="card card-padding rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">{currentMonthLabel} 멤버별 기상 현황</h2>
          {isAdmin && (
            <input
              type="month"
              className="rounded border px-3 py-2"
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
                        <span className={`inline-block h-4 w-4 rounded ${state === 'success' ? 'bg-blue-500' : 'bg-red-500'}`}></span>
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

      

      {isAdmin && (
        <section className="card card-padding rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">관리자: 월별 멤버 검색</h2>
            <input className="rounded border px-3 py-2" placeholder="멤버 이름 검색" value={adminQuery} onChange={(e) => setAdminQuery(e.target.value)} />
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
                  <th className="text-center w-28">완료%</th>
                  <th className="text-center w-28">실패%</th>
                </tr>
              </thead>
              <tbody>
                {memberMonthGrid
                  .filter((m) => (adminQuery ? m.name.includes(adminQuery) : true))
                  .map((row) => {
                    const membersRaw = typeof window !== 'undefined' ? localStorage.getItem('members') : null;
                    let code = '';
                    if (membersRaw) {
                      try {
                        const list = JSON.parse(membersRaw) as Array<{ name: string; code: string }>;
                        const f = list.find((m) => m.name === row.name);
                        code = f?.code || '';
                      } catch {}
                    }
                    let success = 0;
                    let fail = 0;
                    for (let i = 0; i < monthMeta.days; i++) {
                      const ymd = `${monthMeta.year}-${String(monthMeta.month).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`;
                      const k = `wake:${code}:${ymd}`;
                      const raw = typeof window !== 'undefined' ? localStorage.getItem(k) : null;
                      if (raw) {
                        try {
                          const rec = JSON.parse(raw);
                          if (rec.status === 'success') success += 1;
                          if (rec.status === 'fail') fail += 1;
                        } catch {}
                      }
                    }
                    const total = success + fail;
                    const successPct = total === 0 ? 0 : Math.round((success / total) * 100);
                    const failPct = total === 0 ? 0 : 100 - successPct;
                    return (
                      <tr key={row.name}>
                        <td className="py-2 pr-2 font-medium whitespace-nowrap">{row.name}</td>
                        {new Array(monthMeta.days).fill(null).map((_, idx) => {
                          const ymd = `${monthMeta.year}-${String(monthMeta.month).padStart(2,'0')}-${String(idx+1).padStart(2,'0')}`;
                          const k = `wake:${code}:${ymd}`;
                          const raw = typeof window !== 'undefined' ? localStorage.getItem(k) : null;
                          if (!raw) {
                            return (
                              <td key={idx} className="px-1 text-center">
                                <span className="inline-block h-4 w-4 rounded border border-gray-300 bg-transparent"></span>
                              </td>
                            );
                          }
                          let state: 'success' | 'fail' | 'none' = 'none';
                          try { const rec = JSON.parse(raw!); state = rec.status; } catch {}
                          return (
                            <td key={idx} className="px-1 text-center">
                              <span className={`inline-block h-4 w-4 rounded ${state === 'success' ? 'bg-blue-500' : state === 'fail' ? 'bg-red-500' : 'border border-gray-300 bg-transparent'}`}></span>
                            </td>
                          );
                        })}
                        <td className="text-center text-blue-600 font-semibold">{successPct}%</td>
                        <td className="text-center text-red-600 font-semibold">{failPct}%</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-600 mt-3">검색은 부분 일치로 동작합니다.</p>
        </section>
      )}

      {/* 멤버별 점수 순위 */}
      <section className="card card-padding rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">멤버별 점수 순위 ({currentMonthLabel})</h2>
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
              {monthlyScores.map((m, idx) => (
                <tr key={m.name} className={m.name === name ? 'text-red-600 font-semibold' : ''}>
                  <td className="py-2">{(m as any).rank}위</td>
                  <td className="py-2 font-medium">{m.name}</td>
                  <td className="py-2 text-center">{m.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}


