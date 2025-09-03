"use client";

import { useState, useEffect } from "react";
import { getMembers, getWakeupLogs, addWakeupLog } from "@/lib/supabase-utils";
import { supabaseClient } from "@/lib/supabase";

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
  wakeup_status: 'success' | 'fail';
  frog_status: 'completed' | 'not_completed';
  note?: string;
  created_at: string;
}

export default function AdminWakeupPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStatus, setSelectedStatus] = useState<'success' | 'fail'>('success');
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [wakeupLogs, setWakeupLogs] = useState<WakeupLog[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // 관리자 권한 확인
    const admin = localStorage.getItem("is_admin") === "true";
    if (!admin) {
      window.location.href = "/login";
      return;
    }
    setIsAdmin(true);
    
    loadMembers();
  }, []);

  useEffect(() => {
    if (selectedMember && selectedDate) {
      loadWakeupLogs();
    }
  }, [selectedMember, selectedDate]);

  const loadMembers = async () => {
    try {
      const allMembers = await getMembers();
      setMembers(allMembers.filter(member => !member.is_admin)); // 관리자 제외
    } catch (error) {
      console.error("멤버 로드 실패:", error);
      setMessage("멤버 목록을 불러오는데 실패했습니다.");
    }
  };

  const loadWakeupLogs = async () => {
    try {
      if (!selectedMember || !selectedDate) return;
      
      const logs = await getWakeupLogs(selectedMember, new Date(selectedDate).getFullYear(), new Date(selectedDate).getMonth() + 1);
      if (logs) {
        setWakeupLogs(logs);
      }
    } catch (error) {
      console.error("기상 로그 로드 실패:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMember || !selectedDate) {
      setMessage("멤버와 날짜를 선택해주세요.");
      return;
    }

    try {
      setIsLoading(true);
      setMessage("");

      // upsert 방식으로 저장 (기존 기록이 있으면 업데이트, 없으면 추가)
      await addWakeupLog(
        selectedMember, 
        selectedDate, 
        selectedStatus, 
        "not_completed", // 개구리 상태는 기본값으로 설정
        undefined, // 기상 시간은 설정하지 않음
        undefined, // 개구리 시간은 설정하지 않음
        note
      );
      
      setMessage("기상 상태가 성공적으로 저장되었습니다!");
      
      // 폼 초기화
      setNote("");
      
      // 로그 다시 로드
      await loadWakeupLogs();
      
      // 성공 메시지 표시 후 3초 후 제거
      setTimeout(() => setMessage(""), 3000);
      
    } catch (error: any) {
      console.error("기상 상태 저장 실패:", error);
      
      // 구체적인 에러 메시지 표시
      let errorMessage = "저장에 실패했습니다.";
      
      if (error.message) {
        if (error.message.includes("duplicate key")) {
          errorMessage = "이미 해당 날짜에 기상 기록이 존재합니다. 기존 기록을 업데이트합니다.";
        } else if (error.message.includes("unique constraint")) {
          errorMessage = "중복된 기록입니다. 기존 기록을 업데이트합니다.";
        } else {
          errorMessage = `저장 실패: ${error.message}`;
        }
      }
      
      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedMemberName = () => {
    const member = members.find(m => m.code === selectedMember);
    return member ? member.name : "";
  };

  const getCurrentLog = () => {
    return wakeupLogs.find(log => log.date === selectedDate);
  };

  if (!isAdmin) {
    return <div>접근 권한이 없습니다.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">관리자 기상 체크</h1>
        <p className="text-gray-600 mb-6">
          멤버의 특정 날짜 기상을 수동으로 체크하고 점수에 반영할 수 있습니다.
        </p>

        {/* 기상 상태 체크 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                멤버 선택
              </label>
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">멤버를 선택하세요</option>
                {members.map((member) => (
                  <option key={member.id} value={member.code}>
                    {member.name} ({member.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                날짜 선택
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                기상 상태
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as 'success' | 'fail')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="success">성공</option>
                <option value="fail">실패</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                메모 (선택사항)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="기상 체크 관련 메모를 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            {isLoading ? "저장 중..." : "기상 상태 저장"}
          </button>
        </form>

        {/* 메시지 표시 */}
        {message && (
          <div className={`mt-4 p-3 rounded-md ${
            message.includes("성공") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}>
            {message}
          </div>
        )}
      </div>

      {/* 선택된 멤버의 기상 기록 */}
      {selectedMember && selectedDate && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {getSelectedMemberName()}의 {selectedDate} 기상 기록
          </h2>
          
          {getCurrentLog() ? (
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">상태:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    getCurrentLog()?.wakeup_status === 'success' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {getCurrentLog()?.wakeup_status === 'success' ? '성공' : '실패'}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">저장 시간:</span>
                  <span className="ml-2 text-sm text-gray-900">
                    {new Date(getCurrentLog()?.created_at || '').toLocaleString('ko-KR')}
                  </span>
                </div>
                {getCurrentLog()?.note && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">메모:</span>
                    <span className="ml-2 text-sm text-gray-900">{getCurrentLog()?.note}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8">
              해당 날짜의 기상 기록이 없습니다.
            </div>
          )}
        </div>
      )}

      {/* 안내 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">안내</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 기상 상태를 변경하면 해당 멤버의 점수가 자동으로 반영됩니다.</li>
          <li>• 성공: 1점 추가, 실패: 0점</li>
          <li>• 저장된 기록은 대시보드의 달력과 점수 계산에 즉시 반영됩니다.</li>
          <li>• 기존 기록이 있으면 자동으로 업데이트됩니다.</li>
        </ul>
      </div>
    </div>
  );
}
