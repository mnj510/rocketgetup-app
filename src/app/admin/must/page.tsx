"use client";

import { useEffect, useState } from "react";
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
  created_at: string;
}

export default function AdminMustPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [mustRecord, setMustRecord] = useState<MustRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // 관리자 권한 확인
    if (typeof window !== "undefined") {
      const admin = localStorage.getItem("is_admin") === "1";
      setIsAdmin(admin);
      if (!admin) {
        window.location.href = "/dashboard";
        return;
      }
    }
    
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await getMembers();
      setMembers(data.filter(m => !m.is_admin)); // 관리자 제외
      if (data.length > 0) {
        setSelectedMember(data[0].code); // 첫 번째 멤버 선택
      }
    } catch (error) {
      console.error("멤버 로딩 실패:", error);
      setMessage("멤버 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const loadMustRecord = async () => {
    if (!selectedMember) return;
    
    try {
      setLoading(true);
      const record = await getMustRecord(selectedMember, selectedDate);
      setMustRecord(record);
      if (!record) {
        setMessage("해당 날짜에 MUST 기록이 없습니다.");
      } else {
        setMessage("");
      }
    } catch (error) {
      console.error("MUST 기록 로드 실패:", error);
      setMessage("MUST 기록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!mustRecord) return;
    
    if (!confirm("정말로 이 MUST 기록을 삭제하시겠습니까?")) return;
    
    try {
      setLoading(true);
      await deleteMustRecord(mustRecord.id);
      setMessage("MUST 기록이 삭제되었습니다.");
      setMustRecord(null);
    } catch (error) {
      console.error("MUST 기록 삭제 실패:", error);
      setMessage("삭제에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedMember && selectedDate) {
      loadMustRecord();
    }
  }, [selectedMember, selectedDate]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-700 mb-2">접근 권한이 없습니다</div>
          <div className="text-gray-500">관리자만 접근할 수 있습니다.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">MUST 관리</h1>
        <p className="text-gray-600">멤버별 MUST 기록 조회 및 관리</p>
      </div>

      {/* 검색 조건 */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">검색 조건</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="member" className="block text-sm font-medium text-gray-700 mb-1">
              멤버 선택
            </label>
            <select
              id="member"
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">멤버를 선택하세요</option>
              {members.map((member) => (
                <option key={member.code} value={member.code}>
                  {member.name} ({member.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              날짜 선택
            </label>
            <input
              type="date"
              id="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* MUST 기록 표시 */}
      {mustRecord && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {members.find(m => m.code === selectedMember)?.name}님의 MUST 기록
            </h2>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "삭제 중..." : "기록 삭제"}
            </button>
          </div>
          
          <div className="p-6 space-y-6">
            {/* 우선순위 MUST */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">🎯 내일 우선순위 MUST 5가지</h3>
              <div className="space-y-2">
                {mustRecord.priorities.map((priority, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <span className="text-lg font-bold text-blue-600 w-8">{index + 1}</span>
                    <div className="flex-1 px-3 py-2 bg-gray-50 rounded-md border">
                      {priority || "(입력 없음)"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 개구리 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">🐸 개구리 3가지</h3>
              <div className="space-y-2">
                {mustRecord.frogs.map((frog, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <span className="text-lg font-bold text-green-600 w-8">{index + 1}</span>
                    <div className="flex-1 px-3 py-2 bg-gray-50 rounded-md border">
                      {frog || "(입력 없음)"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 하루 복기 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">📝 하루 복기</h3>
              <div className="px-3 py-2 bg-gray-50 rounded-md border min-h-[100px]">
                {mustRecord.retro || "(입력 없음)"}
              </div>
            </div>

            {/* 메타 정보 */}
            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">기록 날짜:</span> {new Date(mustRecord.date).toLocaleDateString("ko-KR")}
                </div>
                <div>
                  <span className="font-medium">작성 시간:</span> {new Date(mustRecord.created_at).toLocaleString("ko-KR")}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 메시지 표시 */}
      {message && (
        <div className={`mt-6 p-4 rounded-lg text-center ${
          message.includes("실패") 
            ? "bg-red-50 text-red-800 border border-red-200" 
            : message.includes("삭제되었습니다")
              ? "bg-green-50 text-green-800 border border-green-200"
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

      {/* 뒤로가기 버튼 */}
      <div className="text-center mt-8">
        <a
          href="/admin"
          className="text-gray-500 hover:text-gray-700 underline"
        >
          ← 관리자 페이지로 돌아가기
        </a>
      </div>
    </div>
  );
}
