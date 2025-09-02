"use client";

import { useState, useEffect } from "react";
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
}

export default function DashboardPage() {
  const router = useRouter();
  const [memberCode, setMemberCode] = useState("");
  const [memberName, setMemberName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberStats, setMemberStats] = useState<MemberStats[]>([]);
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
      // Supabase에서 직접 멤버 이름 가져오기
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
    } catch (error) {
      console.error("대시보드 데이터 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


