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
  status: 'success' | 'fail';
  note?: string;
}

export default function AdminWakeupPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<'success' | 'fail'>('success');
  const [note, setNote] = useState("");
  const [wakeupLogs, setWakeupLogs] = useState<WakeupLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // 관리자 권한 확인
    if (typeof window !== "undefined") {
      const admin = localStorage.getItem("is_admin") === "true";
      if (!admin) {
        window.location.href = "/dashboard";
        return;
      }
    }
    
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
      setMembers(allMembers.filter(m => !m.is_admin)); // 관리자 제외
    } catch (error) {
      console.error("멤버 로드 실패:", error);
      setMessage("멤버 목록을 불러오는데 실패했습니다.");
    }
  };

  const loadWakeupLogs = async () => {
    if (!selectedMember || !selectedDate) return;
    
    try {
      setIsLoading(true);
      const [year, month] = selectedDate.split('-').map(Number);
      const logs = await getWakeupLogs(selectedMember, year, month);
      setWakeupLogs(logs);
    } catch (error) {
      console.error("기상 기록 로드 실패:", error);
      setMessage("기상 기록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !selectedDate) {
      setMessage("멤버와 날짜를 모두 선택해주세요.");
      return;
    }

    try {
      setIsLoading(true);
      
      // 기존 기록이 있는지 확인
      const existingLog = wakeupLogs.find(log => log.date === selectedDate);
      
      if (existingLog) {
        // 기존 기록 업데이트
        const { error } = await supabaseClient
          .from('wakeup_logs')
          .update({ 
            status: selectedStatus, 
            note: note.trim() || null 
          })
          .eq('id', existingLog.id);
        
        if (error) throw error;
        setMessage(`"${selectedDate}" 기상 기록이 "${selectedStatus === 'success' ? '성공' : '실패'}"로 업데이트되었습니다.`);
      } else {
        // 새 기록 추가
        await addWakeupLog(selectedMember, selectedDate, selectedStatus, note.trim() || undefined);
        setMessage(`"${selectedDate}" 기상 기록이 "${selectedStatus === 'success' ? '성공' : '실패'}"로 추가되었습니다.`);
      }
      
      // 기록 목록 새로고침
      await loadWakeupLogs();
      
      // 폼 초기화
      setNote("");
      
    } catch (error: any) {
      console.error("기상 기록 저장 실패:", error);
      setMessage("기상 기록 저장에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const getToday = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getStatusText = (status: 'success' | 'fail') => {
    return status === 'success' ? '성공' : '실패';
  };

  const getStatusColor = (status: 'success' | 'fail') => {
    return status === 'success' ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">관리자 기상 체크</h1>
        <p className="text-gray-600">멤버의 특정 날짜 기상을 수동으로 체크하고 점수에 반영할 수 있습니다.</p>
      </div>

      {/* 기상 체크 폼 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">기상 상태 체크</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                max={getToday()}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                기상 상태
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as 'success' | 'fail')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="success">성공</option>
                <option value="fail">실패</option>
              </select>
            </div>
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
          
          <button
            type="submit"
            disabled={isLoading || !selectedMember || !selectedDate}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md transition-colors disabled:cursor-not-allowed"
          >
            {isLoading ? "저장 중..." : "기상 상태 저장"}
          </button>
        </form>
      </div>

      {/* 선택된 멤버의 기상 기록 */}
      {selectedMember && selectedDate && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {members.find(m => m.code === selectedMember)?.name}의 {selectedDate} 기상 기록
          </h2>
          
          {isLoading ? (
            <div className="text-center py-4 text-gray-500">로딩 중...</div>
          ) : wakeupLogs.length === 0 ? (
            <div className="text-center py-4 text-gray-500">해당 날짜의 기상 기록이 없습니다.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left py-2">날짜</th>
                    <th className="text-left py-2">상태</th>
                    <th className="text-left py-2">메모</th>
                  </tr>
                </thead>
                <tbody>
                  {wakeupLogs
                    .filter(log => log.date === selectedDate)
                    .map((log) => (
                      <tr key={log.id} className="border-b">
                        <td className="py-2">{log.date}</td>
                        <td className={`py-2 font-medium ${getStatusColor(log.status)}`}>
                          {getStatusText(log.status)}
                        </td>
                        <td className="py-2 text-gray-600">
                          {log.note || "-"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>💡 안내:</strong> 기상 상태를 변경하면 해당 멤버의 점수가 자동으로 반영됩니다.
              <br />
              • 성공: 1점 추가 • 실패: 0점
            </p>
          </div>
        </div>
      )}

      {/* 메시지 표시 */}
      {message && (
        <div className={`p-4 rounded-md ${
          message.includes("성공") ? "bg-green-50 text-green-800 border border-green-200" :
          message.includes("실패") ? "bg-red-50 text-red-800 border border-red-200" :
          "bg-blue-50 text-blue-800 border border-blue-200"
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}
