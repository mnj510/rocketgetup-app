"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMustRecord, saveMustRecord } from "@/lib/supabase-utils";
import { supabaseClient } from "@/lib/supabase";

interface MustRecord {
  id: string;
  member_code: string;
  date: string;
  priorities: string[];
  frogs: string[];
  retro: string;
  created_at: string;
}

export default function MustWritePage() {
  const router = useRouter();
  const [memberCode, setMemberCode] = useState("");
  const [memberName, setMemberName] = useState("");
  const [priorities, setPriorities] = useState(["", "", "", "", ""]);
  const [frogs, setFrogs] = useState(["", "", ""]);
  const [retro, setRetro] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [yesterdayRecord, setYesterdayRecord] = useState<MustRecord | null>(null);
  const [todayRecord, setTodayRecord] = useState<MustRecord | null>(null);

  useEffect(() => {
    const code = localStorage.getItem("member_code");
    if (!code) {
      router.push("/login");
      return;
    }

    setMemberCode(code);
    getMemberName(code);
    loadRecords();
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

  const loadRecords = async () => {
    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const todayStr = today.toISOString().split('T')[0];
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // 어제 기록 로드
      const yesterdayData = await getMustRecord(memberCode, yesterdayStr);
      if (yesterdayData) {
        setYesterdayRecord(yesterdayData);
      }

      // 오늘 기록 로드
      const todayData = await getMustRecord(memberCode, todayStr);
      if (todayData) {
        setTodayRecord(todayData);
        setPriorities(todayData.priorities || ["", "", "", "", ""]);
        setFrogs(todayData.frogs || ["", "", ""]);
        setRetro(todayData.retro || "");
      }
    } catch (error) {
      console.error("기록 로드 실패:", error);
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
    
    try {
      setIsLoading(true);
      setMessage("");

      const today = new Date().toISOString().split('T')[0];
      
      await saveMustRecord(memberCode, today, priorities, frogs, retro);
      
      setMessage("MUST 기록이 성공적으로 저장되었습니다!");
      await loadRecords(); // 기록 다시 로드
      
      setTimeout(() => setMessage(""), 3000);
    } catch (error: any) {
      console.error("MUST 기록 저장 실패:", error);
      setMessage(`저장에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todayStr = today.toISOString().split('T')[0];
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      // 오늘 작성한 내용만 복사
      const copyText = `${tomorrowStr.slice(2)} [${memberName}]

[우선순위 MUST]
${priorities.map((priority, index) => priority.trim() ? `${index + 1}. ${priority.trim()}` : '').filter(Boolean).join('\n')}

[개구리]
${frogs.map((frog, index) => frog.trim() ? `🐸 ${index + 1}. ${frog.trim()}` : '').filter(Boolean).join('\n')}

[${todayStr.slice(2)} 하루 복기]
${retro.trim()}`;

      await navigator.clipboard.writeText(copyText);
      setMessage("오늘 작성한 내용이 클립보드에 복사되었습니다!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("복사 실패:", error);
      setMessage("복사에 실패했습니다.");
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">MUST 작성</h1>
        <p className="text-gray-600 mt-2">
          어제 기록과 비교하여 오늘의 MUST를 작성하세요
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 왼쪽: 어제 기록 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center justify-between">
            <span>어제 기록</span>
            <span className="text-sm text-gray-500">
              {yesterdayRecord ? formatDate(yesterdayRecord.date) : '기록 없음'}
            </span>
          </h2>
          
          {yesterdayRecord ? (
            <div className="space-y-6">
              {/* 우선순위 MUST */}
              <div>
                <h3 className="text-md font-medium text-gray-700 mb-3">우선순위 MUST</h3>
                <div className="space-y-2">
                  {yesterdayRecord.priorities?.map((priority, index) => (
                    priority.trim() && (
                      <div key={index} className="p-3 bg-gray-50 rounded-md">
                        <span className="text-sm font-medium text-gray-600">{index + 1}. </span>
                        <span className="text-sm text-gray-800">{priority}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>

              {/* 개구리 */}
              <div>
                <h3 className="text-md font-medium text-gray-700 mb-3">개구리</h3>
                <div className="space-y-2">
                  {yesterdayRecord.frogs?.map((frog, index) => (
                    frog.trim() && (
                      <div key={index} className="p-3 bg-gray-50 rounded-md">
                        <span className="text-sm font-medium text-gray-600">🐸 {index + 1}. </span>
                        <span className="text-sm text-gray-800">{frog}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>

              {/* 하루 복기 */}
              {yesterdayRecord.retro && (
                <div>
                  <h3 className="text-md font-medium text-gray-700 mb-3">하루 복기</h3>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <span className="text-sm text-gray-800">{yesterdayRecord.retro}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>어제 기록이 없습니다.</p>
              <p className="text-sm mt-2">첫 번째 기록을 작성해보세요!</p>
            </div>
          )}
        </div>

        {/* 오른쪽: 오늘 작성 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">오늘 작성</h2>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500">
                {new Date().toISOString().split('T')[0]}
              </span>
              <button
                onClick={handleCopy}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                복사
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 우선순위 MUST */}
            <div>
              <h3 className="text-md font-medium text-gray-700 mb-3">우선순위 MUST</h3>
              <div className="space-y-2">
                {priorities.map((priority, index) => (
                  <input
                    key={index}
                    type="text"
                    value={priority}
                    onChange={(e) => handlePriorityChange(index, e.target.value)}
                    placeholder={`우선순위 ${index + 1}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                ))}
              </div>
            </div>

            {/* 개구리 */}
            <div>
              <h3 className="text-md font-medium text-gray-700 mb-3">개구리</h3>
              <div className="space-y-2">
                {frogs.map((frog, index) => (
                  <input
                    key={index}
                    type="text"
                    value={frog}
                    onChange={(e) => handleFrogChange(index, e.target.value)}
                    placeholder={`개구리 ${index + 1}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                ))}
              </div>
            </div>

            {/* 하루 복기 */}
            <div>
              <h3 className="text-md font-medium text-gray-700 mb-3">하루 복기</h3>
              <textarea
                value={retro}
                onChange={(e) => setRetro(e.target.value)}
                placeholder="오늘 하루를 돌아보며 느낀 점을 작성하세요"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {isLoading ? "저장 중..." : "저장"}
            </button>
          </form>
        </div>
      </div>

      {/* 메시지 표시 */}
      {message && (
        <div className={`mt-6 p-4 rounded-md ${
          message.includes("성공") || message.includes("복사") 
            ? "bg-green-100 text-green-800" 
            : "bg-red-100 text-red-800"
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}


