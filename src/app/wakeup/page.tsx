"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addWakeupLog, getWakeupLogs } from "@/lib/supabase-utils";

export default function WakeupPage() {
  const router = useRouter();
  const [memberCode, setMemberCode] = useState("");
  const [memberName, setMemberName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [today] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    // 로그인 상태 확인
    if (typeof window !== "undefined") {
      const code = localStorage.getItem("member_code");
      const admin = localStorage.getItem("is_admin") === "1";
      
      if (!code && !admin) {
        router.replace("/login");
        return;
      }
      
      setIsAdmin(admin);
      if (code) {
        setMemberCode(code);
        // 멤버 이름 가져오기 (간단한 구현)
        const membersRaw = localStorage.getItem("members");
        if (membersRaw) {
          try {
            const members = JSON.parse(membersRaw);
            const member = members.find((m: any) => m.code === code);
            if (member) setMemberName(member.name);
          } catch {}
        }
      }
    }
  }, [router]);

  const handleWakeupCheck = async (status: 'success' | 'fail') => {
    if (!memberCode && !isAdmin) {
      setMessage("멤버 코드가 필요합니다.");
      return;
    }

    try {
      setLoading(true);
      await addWakeupLog(memberCode || 'admin', today, status);
      setMessage(`기상 ${status === 'success' ? '성공' : '실패'}이 기록되었습니다!`);
      
      // 잠시 후 대시보드로 이동
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (error) {
      console.error("기상 체크 실패:", error);
      setMessage("기상 체크 기록에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (!memberCode && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-700 mb-2">로그인이 필요합니다</div>
          <div className="text-gray-500">멤버 코드로 로그인 후 이용하세요.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {memberName ? `${memberName}님의` : ""} 기상 체크
          </h1>
          <p className="text-gray-600">오늘의 기상 상태를 기록해주세요</p>
          <div className="mt-2 text-sm text-gray-500">
            {new Date().toLocaleDateString("ko-KR", { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              weekday: 'long'
            })}
          </div>
        </div>

        {/* 기상 체크 버튼 */}
        <div className="space-y-4 mb-8">
          <button
            onClick={() => handleWakeupCheck('success')}
            disabled={loading}
            className="w-full bg-green-600 text-white py-4 px-6 rounded-xl text-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
          >
            🌅 기상 성공
          </button>
          
          <button
            onClick={() => handleWakeupCheck('fail')}
            disabled={loading}
            className="w-full bg-red-600 text-white py-4 px-6 rounded-xl text-lg font-semibold hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
          >
            😴 기상 실패
          </button>
        </div>

        {/* 메시지 표시 */}
        {message && (
          <div className={`p-4 rounded-lg text-center ${
            message.includes("성공") 
              ? "bg-green-50 text-green-800 border border-green-200" 
              : message.includes("실패") 
                ? "bg-red-50 text-red-800 border border-red-200"
                : "bg-blue-50 text-blue-800 border border-blue-200"
          }`}>
            {message}
          </div>
        )}

        {/* 로딩 표시 */}
        {loading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div className="mt-2 text-gray-600">처리 중...</div>
          </div>
        )}

        {/* 하단 안내 */}
        <div className="text-center text-sm text-gray-500 mt-8">
          <p>기상 체크 후 자동으로 대시보드로 이동합니다.</p>
          <p className="mt-1">매일 한 번씩 기록할 수 있습니다.</p>
        </div>

        {/* 뒤로가기 버튼 */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.back()}
            className="text-gray-500 hover:text-gray-700 underline"
          >
            ← 뒤로가기
          </button>
        </div>
      </div>
    </div>
  );
}


