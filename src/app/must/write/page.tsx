"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMustRecord, saveMustRecord } from "@/lib/supabase-utils";
import { supabaseClient } from "@/lib/supabase";

export default function MustWritePage() {
  const router = useRouter();
  const [memberCode, setMemberCode] = useState("");
  const [memberName, setMemberName] = useState("");
  const [priorities, setPriorities] = useState(["", "", "", "", ""]);
  const [frogs, setFrogs] = useState(["", "", ""]);
  const [retro, setRetro] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const code = localStorage.getItem("member_code");
    if (!code) {
      router.push("/login");
      return;
    }
    setMemberCode(code);
    getMemberName(code);
    loadTodayRecord();
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

  const loadTodayRecord = async () => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const record = await getMustRecord(memberCode, today);
      if (record) {
        setPriorities(record.priorities || ["", "", "", "", ""]);
        setFrogs(record.frogs || ["", "", ""]);
        setRetro(record.retro || "");
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
    setIsLoading(true);
    setMessage("");

    try {
      const today = new Date().toISOString().split('T')[0];
      await saveMustRecord(memberCode, today, priorities, frogs, retro);
      setMessage("MUST 기록이 저장되었습니다!");
    } catch (error) {
      setMessage("저장에 실패했습니다.");
      console.error("저장 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const tomorrowStr = tomorrow.toISOString().slice(2, 8).replace(/-/g, '');
    const todayStr = today.toISOString().slice(2, 8).replace(/-/g, '');
    
    const prioritiesText = priorities.filter(p => p.trim()).map((p, i) => `${i + 1}. ${p}`).join('\n');
    const frogsText = frogs.filter(f => f.trim()).map((f, i) => `🐸 ${i + 1}. ${f}`).join('\n');
    
    const text = `${tomorrowStr} ${memberName}

[우선순위 MUST]
${prioritiesText}

[개구리]
${frogsText}

[${todayStr} 하루 복기]
${retro}`;

    navigator.clipboard.writeText(text).then(() => {
      setMessage("텔레그램 양식으로 복사되었습니다!");
    }).catch(() => {
      setMessage("복사에 실패했습니다.");
    });
  };

  if (!memberCode) {
    return <div className="text-center py-8">로딩 중...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">MUST 작성</h1>
          <button
            onClick={copyToClipboard}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
          >
            복사
          </button>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-md ${
            message.includes('성공') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 우선순위 MUST */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">우선순위 MUST</h2>
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
            <h2 className="text-lg font-semibold text-gray-800 mb-3">개구리</h2>
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
            <h2 className="text-lg font-semibold text-gray-800 mb-3">하루 복기</h2>
            <textarea
              value={retro}
              onChange={(e) => setRetro(e.target.value)}
              placeholder="오늘 하루를 돌아보며 느낀 점을 작성해주세요"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-2 rounded-md font-medium transition-colors"
            >
              {isLoading ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


