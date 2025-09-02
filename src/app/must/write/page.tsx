"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveMustRecord, getMustRecord } from "@/lib/supabase-utils";

export default function MustWritePage() {
  const router = useRouter();
  const [memberCode, setMemberCode] = useState("");
  const [memberName, setMemberName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [today] = useState(new Date().toISOString().split('T')[0]);
  
  // MUST 입력 필드들
  const [priorities, setPriorities] = useState(["", "", "", "", ""]);
  const [frogs, setFrogs] = useState(["", "", ""]);
  const [retro, setRetro] = useState("");

  useEffect(() => {
    // 로그인 상태 확인
    if (typeof window !== "undefined") {
      const code = localStorage.getItem("member_code");
      if (!code) {
        router.replace("/login");
        return;
      }
      
      setMemberCode(code);
      
      // 멤버 이름 가져오기
      const membersRaw = localStorage.getItem("members");
      if (membersRaw) {
        try {
          const members = JSON.parse(membersRaw);
          const member = members.find((m: any) => m.code === code);
          if (member) setMemberName(member.name);
        } catch {}
      }
      
      // 기존 데이터 로드
      loadExistingData();
    }
  }, [router]);

  const loadExistingData = async () => {
    try {
      const existing = await getMustRecord(memberCode, today);
      if (existing) {
        setPriorities(existing.priorities || ["", "", "", "", ""]);
        setFrogs(existing.frogs || ["", "", ""]);
        setRetro(existing.retro || "");
      }
    } catch (error) {
      console.error("기존 데이터 로드 실패:", error);
    }
  };

  const handlePriorityChange = (index: number, value: string) => {
    const newPriorities = [...priorities];
    newPriorities[index] = value;
    setPriorities(newPriorities);
  };

  const handleFrogChange = (index: number, value: string) => {
    const newFrogs = [...frogs];
    newFrogs[index] = value;
    setFrogs(newFrogs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loading) return;

    try {
      setLoading(true);
      await saveMustRecord(memberCode, today, priorities, frogs, retro);
      setMessage("MUST 기록이 저장되었습니다!");
      
      // 잠시 후 대시보드로 이동
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (error) {
      console.error("MUST 저장 실패:", error);
      setMessage("저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  if (!memberCode) {
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {memberName ? `${memberName}님의` : ""} MUST 작성
          </h1>
          <p className="text-gray-600">내일의 우선순위와 오늘의 개구리를 정리해보세요</p>
          <div className="mt-2 text-sm text-gray-500">
            {new Date().toLocaleDateString("ko-KR", { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              weekday: 'long'
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 내일 우선순위 MUST 5가지 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              🎯 내일 우선순위 MUST 5가지
            </h2>
            <div className="space-y-3">
              {priorities.map((priority, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <span className="text-lg font-bold text-blue-600 w-8">{index + 1}</span>
                  <input
                    type="text"
                    value={priority}
                    onChange={(e) => handlePriorityChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`우선순위 ${index + 1}을 입력하세요`}
                    maxLength={100}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 개구리 3가지 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              🐸 개구리 3가지 (미루고 있는 일들)
            </h2>
            <div className="space-y-3">
              {frogs.map((frog, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <span className="text-lg font-bold text-green-600 w-8">{index + 1}</span>
                  <input
                    type="text"
                    value={frog}
                    onChange={(e) => handleFrogChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder={`개구리 ${index + 1}을 입력하세요`}
                    maxLength={100}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 하루 복기 */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              📝 하루 복기
            </h2>
            <textarea
              value={retro}
              onChange={(e) => setRetro(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={4}
              placeholder="오늘 하루를 돌아보며 느낀 점, 개선할 점, 감사한 일 등을 자유롭게 작성해보세요..."
              maxLength={500}
            />
            <div className="mt-2 text-sm text-gray-500 text-right">
              {retro.length}/500
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="text-center">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-purple-600 text-white py-3 px-8 rounded-lg text-lg font-semibold hover:bg-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
            >
              {loading ? "저장 중..." : "MUST 저장하기"}
            </button>
          </div>
        </form>

        {/* 메시지 표시 */}
        {message && (
          <div className={`mt-6 p-4 rounded-lg text-center ${
            message.includes("저장되었습니다") 
              ? "bg-green-50 text-green-800 border border-green-200" 
              : "bg-red-50 text-red-800 border border-red-200"
          }`}>
            {message}
          </div>
        )}

        {/* 로딩 표시 */}
        {loading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <div className="mt-2 text-gray-600">저장 중...</div>
          </div>
        )}

        {/* 뒤로가기 버튼 */}
        <div className="text-center mt-8">
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


