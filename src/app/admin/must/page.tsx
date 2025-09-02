"use client";

import { useState, useEffect } from "react";
import { getMembers, getMustRecord, deleteMustRecord } from "@/lib/supabase-utils";

interface Member {
  id: string;
  code: string;
  name: string;
  is_admin: boolean;
}

interface MustRecord {
  id: string;
  member_code: string;
  date: string;
  priorities: string[];
  frogs: string[];
  retro: string;
}

export default function AdminMustPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [mustRecord, setMustRecord] = useState<MustRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const allMembers = await getMembers();
      setMembers(allMembers);
    } catch (error) {
      console.error("멤버 로드 실패:", error);
      setMessage("멤버 목록을 불러오는데 실패했습니다.");
    }
  };

  const loadMustRecord = async () => {
    if (!selectedMember || !selectedDate) return;
    
    setIsLoading(true);
    try {
      const record = await getMustRecord(selectedMember, selectedDate);
      setMustRecord(record);
      setMessage("");
    } catch (error) {
      console.error("MUST 기록 로드 실패:", error);
      setMessage("MUST 기록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMustRecord = async () => {
    if (!mustRecord) return;
    
    if (!confirm("정말로 이 MUST 기록을 삭제하시겠습니까? 삭제 시 해당 멤버의 점수도 1점 감소합니다.")) {
      return;
    }
    
    setIsLoading(true);
    try {
      await deleteMustRecord(mustRecord.id);
      setMessage("MUST 기록이 성공적으로 삭제되었습니다. 해당 멤버의 점수가 1점 감소했습니다.");
      setMustRecord(null);
      
      // 멤버 목록 새로고침 (점수 업데이트를 위해)
      await loadMembers();
    } catch (error) {
      console.error("MUST 기록 삭제 실패:", error);
      setMessage("MUST 기록 삭제에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const getToday = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">MUST 관리</h1>
        <p className="text-gray-600">멤버의 MUST 기록을 조회하고 삭제할 수 있습니다.</p>
      </div>

      {/* 멤버 및 날짜 선택 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">기록 조회</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              멤버 선택
            </label>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            />
          </div>
        </div>
        
        <button
          onClick={loadMustRecord}
          disabled={!selectedMember || !selectedDate || isLoading}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors"
        >
          {isLoading ? "로딩 중..." : "기록 조회"}
        </button>
      </div>

      {/* MUST 기록 표시 및 삭제 */}
      {mustRecord && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              MUST 기록 - {members.find(m => m.code === mustRecord.member_code)?.name} ({mustRecord.date})
            </h2>
            <button
              onClick={handleDeleteMustRecord}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors"
            >
              {isLoading ? "삭제 중..." : "기록 삭제"}
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-md font-medium text-gray-700 mb-2">우선순위 MUST</h3>
              <div className="bg-gray-50 p-3 rounded-md">
                {mustRecord.priorities && mustRecord.priorities.length > 0 ? (
                  <ol className="list-decimal list-inside space-y-1">
                    {mustRecord.priorities.map((priority, index) => (
                      <li key={index} className="text-gray-800">{priority}</li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-gray-500">등록된 우선순위가 없습니다.</p>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-md font-medium text-gray-700 mb-2">개구리</h3>
              <div className="bg-gray-50 p-3 rounded-md">
                {mustRecord.frogs && mustRecord.frogs.length > 0 ? (
                  <ol className="list-decimal list-inside space-y-1">
                    {mustRecord.frogs.map((frog, index) => (
                      <li key={index} className="text-gray-800">🐸 {frog}</li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-gray-500">등록된 개구리가 없습니다.</p>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-md font-medium text-gray-700 mb-2">하루 복기</h3>
              <div className="bg-gray-50 p-3 rounded-md">
                {mustRecord.retro ? (
                  <p className="text-gray-800">{mustRecord.retro}</p>
                ) : (
                  <p className="text-gray-500">등록된 하루 복기가 없습니다.</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ 주의:</strong> 이 기록을 삭제하면 해당 멤버의 점수가 1점 감소합니다.
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
