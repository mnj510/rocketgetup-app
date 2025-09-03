"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getMembers, getMonthlyStats } from "@/lib/supabase-utils";
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
  const [memberScores, setMemberScores] = useState<MemberScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

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
  }, [router]);

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
      
      // 각 멤버의 통계 가져오기
      const stats = await Promise.all(
        allMembers.map(async (member) => {
          const stats = await getMonthlyStats(member.code, currentYear, currentMonth);
          
          // 점수 계산: 기상 + MUST + 개구리 (임시로 0점)
          const score = 0; // TODO: 실제 점수 계산 구현
          
          return {
            member,
            ...stats,
            score
          };
        })
      );
      
      setMemberStats(stats);
      
      // 멤버별 점수 순위 계산
      calculateMemberScores(stats);
      
    } catch (error) {
      console.error("대시보드 데이터 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMemberScores = useCallback((stats: MemberStats[]) => {
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
  }, []);

  const getMonthName = (month: number) => {
    const monthNames = [
      "1월", "2월", "3월", "4월", "5월", "6월",
      "7월", "8월", "9월", "10월", "11월", "12월"
    ];
    return monthNames[month - 1];
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <div className="mt-2 text-gray-600">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {isAdmin ? "관리자 대시보드" : `${memberName || memberCode}님의 대시보드`}
        </h1>
        <p className="text-gray-600">
          {currentYear}년 {getMonthName(currentMonth)} 기상 현황
        </p>
      </div>

      {/* 통계 카드 */}
      {!isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">오늘</h3>
            <p className="text-3xl font-bold text-indigo-600">
              {new Date().getDate()} / {new Date().getMonth() + 1}
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

      {/* 통계 카드 (관리자만) */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">전체 멤버</h3>
            <p className="text-3xl font-bold text-indigo-600">
              {members.filter(m => !m.is_admin).length}명
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">전체 기상 성공</h3>
            <p className="text-3xl font-bold text-green-600">
              {memberStats.reduce((total, stat) => total + stat.success, 0)}일
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">전체 기상률</h3>
            <p className="text-3xl font-bold text-blue-600">
              {(() => {
                const totalSuccess = memberStats.reduce((total, stat) => total + stat.success, 0);
                const totalAttempts = memberStats.reduce((total, stat) => total + stat.total, 0);
                return totalAttempts > 0 ? Math.round((totalSuccess / totalAttempts) * 100) : 0;
              })()}%
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">전체 점수</h3>
            <p className="text-3xl font-bold text-purple-600">
              {memberStats.reduce((total, stat) => total + stat.score, 0)}점
            </p>
          </div>
        </div>
      )}

      {/* 멤버별 통계 테이블 */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            {currentYear}년 {getMonthName(currentMonth)} 멤버별 기상 현황
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  멤버
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  기상 성공
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  기상 실패
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  기상률
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  점수
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {memberStats.map((stat) => (
                <tr key={stat.member.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {stat.member.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {stat.success}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {stat.fail}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {stat.rate}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-purple-600">
                    {stat.score}점
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 멤버별 점수 순위 */}
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


