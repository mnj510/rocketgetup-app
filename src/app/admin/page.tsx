"use client";

import { useEffect, useState } from "react";
import { getMembers, addMember, generateMobileLoginCode } from "@/lib/supabase-utils";
import { supabaseClient } from "@/lib/supabase";
import Link from "next/link";

interface Member {
  id: string;
  code: string;
  name: string;
  is_admin: boolean;
  created_at: string;
}

export default function AdminPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [mobileCodeMessage, setMobileCodeMessage] = useState("");
  const [selectedMemberForMobile, setSelectedMemberForMobile] = useState("");

  useEffect(() => {
    // 관리자 권한 확인
    if (typeof window !== "undefined") {
      const admin = localStorage.getItem("is_admin") === "true";
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
      setMembers(data);
    } catch (error) {
      console.error("멤버 로드 실패:", error);
      setMessage("멤버 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) {
      setMessage("코드와 이름을 모두 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      await addMember(newCode.trim(), newName.trim(), false);
      setNewCode("");
      setNewName("");
      setMessage("멤버가 추가되었습니다.");
      await loadMembers(); // 목록 새로고침
    } catch (error: any) {
      console.error("멤버 추가 실패:", error);
      setMessage("멤버 추가에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMobileCode = async (memberCode: string) => {
    try {
      setLoading(true);
      setMobileCodeMessage("");

      const mobileCode = await generateMobileLoginCode(memberCode);
      
      setMobileCodeMessage(`✅ 모바일 로그인 코드가 생성되었습니다: ${mobileCode}`);
      
      // 10초 후 메시지 제거
      setTimeout(() => setMobileCodeMessage(""), 10000);
      
    } catch (error: any) {
      console.error("모바일 로그인 코드 생성 실패:", error);
      setMobileCodeMessage(`❌ 코드 생성 실패: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMember = async (memberId: string, memberName: string) => {
    // 이중 확인 절차
    const firstConfirm = confirm(`정말로 "${memberName}" 멤버를 삭제하시겠습니까?\n\n⚠️ 주의: 이 작업은 되돌릴 수 없습니다!`);
    if (!firstConfirm) return;
    
    const secondConfirm = confirm(`최종 확인: "${memberName}" 멤버를 영구적으로 삭제하시겠습니까?\n\n이 멤버의 모든 데이터(기상 기록, MUST 기록, 점수 등)가 함께 삭제됩니다.`);
    if (!secondConfirm) return;
    
    try {
      setLoading(true);
      
      // 1. 멤버의 모든 관련 데이터 삭제
      console.log(`🔧 ${memberName} 멤버 삭제 시작...`);
      
      const memberCode = members.find(m => m.id === memberId)?.code;
      if (!memberCode) {
        throw new Error("멤버 코드를 찾을 수 없습니다.");
      }
      
      // 1-1. 기상 기록 삭제
      const { error: wakeupError } = await supabaseClient
        .from('wakeup_logs')
        .delete()
        .eq('member_code', memberCode);
      
      if (wakeupError) {
        console.error("기상 기록 삭제 실패:", wakeupError);
        throw new Error(`기상 기록 삭제 실패: ${wakeupError.message}`);
      }
      console.log("✅ 기상 기록 삭제 완료");
      
      // 1-2. MUST 기록 삭제
      const { error: mustError } = await supabaseClient
        .from('must_records')
        .delete()
        .eq('member_code', memberCode);
      
      if (mustError) {
        console.error("MUST 기록 삭제 실패:", mustError);
        throw new Error(`MUST 기록 삭제 실패: ${mustError.message}`);
      }
      console.log("✅ MUST 기록 삭제 완료");
      
      // 1-3. 모바일 로그인 코드 삭제
      const { error: mobileError } = await supabaseClient
        .from('mobile_login_codes')
        .delete()
        .eq('member_code', memberCode);
      
      if (mobileError) {
        console.error("모바일 로그인 코드 삭제 실패:", mobileError);
        // 모바일 코드 삭제 실패는 치명적이지 않으므로 경고만 표시
        console.warn("⚠️ 모바일 로그인 코드 삭제 실패 (무시됨)");
      } else {
        console.log("✅ 모바일 로그인 코드 삭제 완료");
      }
      
      // 2. 마지막으로 멤버 정보 삭제
      const { error: memberError } = await supabaseClient
        .from('members')
        .delete()
        .eq('id', memberId);
      
      if (memberError) {
        console.error("멤버 정보 삭제 실패:", memberError);
        throw new Error(`멤버 정보 삭제 실패: ${memberError.message}`);
      }
      console.log("✅ 멤버 정보 삭제 완료");
      
      setMessage(`"${memberName}" 멤버와 모든 관련 데이터가 성공적으로 삭제되었습니다.`);
      
      // 3. 멤버 목록 새로고침
      await loadMembers();
      
      // 4. 성공 메시지 5초 후 제거
      setTimeout(() => setMessage(""), 5000);
      
    } catch (error: any) {
      console.error("멤버 삭제 실패:", error);
      setMessage(`❌ 멤버 삭제 실패: ${error.message || '알 수 없는 오류'}`);
      
      // 에러 메시지 10초 후 제거
      setTimeout(() => setMessage(""), 10000);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return <div>접근 권한이 없습니다.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">관리자 페이지</h1>
        <p className="text-gray-600">멤버 관리 및 시스템 설정</p>
      </div>

      {/* 관리 메뉴 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link href="/admin/must" className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
          <div className="text-center">
            <div className="text-4xl mb-3">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">MUST 관리</h3>
            <p className="text-gray-600">멤버별 MUST 기록 조회 및 관리</p>
          </div>
        </Link>
        
        <Link href="/admin/wakeup" className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
          <div className="text-center">
            <div className="text-4xl mb-3">⏰</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">기상 체크</h3>
            <p className="text-gray-600">멤버별 수동 기상 상태 관리</p>
          </div>
        </Link>
      </div>

      {/* 멤버 추가 폼 */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">새 멤버 추가</h2>
        <form onSubmit={handleAddMember} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                멤버 코드
              </label>
              <input
                type="text"
                id="code"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="예: A001"
                maxLength={10}
              />
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                멤버 이름
              </label>
              <input
                type="text"
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="예: 홍길동"
                maxLength={20}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "추가 중..." : "멤버 추가"}
          </button>
        </form>
        
        {message && (
          <div className={`mt-4 p-3 rounded-md ${
            message.includes("실패") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
          }`}>
            {message}
          </div>
        )}
      </div>

      {/* 모바일 로그인 코드 생성 섹션 */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">모바일 로그인 코드 생성</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              멤버 선택
            </label>
            <select
              value={selectedMemberForMobile}
              onChange={(e) => setSelectedMemberForMobile(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">멤버를 선택하세요</option>
              {members.filter(member => !member.is_admin).map((member) => (
                <option key={member.id} value={member.code}>
                  {member.name} ({member.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <button
              onClick={() => handleGenerateMobileCode(selectedMemberForMobile)}
              disabled={!selectedMemberForMobile || loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors"
            >
              {loading ? "생성 중..." : "모바일 코드 생성"}
            </button>
          </div>
          <div className="text-sm text-gray-600">
            <p>• 6자리 랜덤 코드 생성</p>
            <p>• 24시간 동안 유효</p>
          </div>
        </div>
        
        {/* 모바일 코드 메시지 */}
        {mobileCodeMessage && (
          <div className={`mt-4 p-3 rounded-md text-center font-mono text-lg ${
            mobileCodeMessage.includes("✅") 
              ? "bg-green-100 text-green-800 border-2 border-green-300" 
              : "bg-red-100 text-red-800"
          }`}>
            {mobileCodeMessage}
          </div>
        )}
      </div>

      {/* 멤버 목록 */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">멤버 목록</h2>
        </div>
        
        {loading ? (
          <div className="p-6 text-center text-gray-500">로딩 중...</div>
        ) : members.length === 0 ? (
          <div className="p-6 text-center text-gray-500">등록된 멤버가 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    코드
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이름
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    권한
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    가입일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {member.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        member.is_admin 
                          ? "bg-purple-100 text-purple-800" 
                          : "bg-green-100 text-green-800"
                      }`}>
                        {member.is_admin ? "관리자" : "일반"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(member.created_at).toLocaleDateString("ko-KR")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {!member.is_admin && (
                        <button
                          onClick={() => handleDeleteMember(member.id, member.name)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-800 font-medium disabled:opacity-50 px-3 py-1 rounded border border-red-200 hover:bg-red-50"
                        >
                          삭제
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


