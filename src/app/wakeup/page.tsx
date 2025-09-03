"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addWakeupLog, getWakeupLogs } from "@/lib/supabase-utils";

interface WakeupLog {
  id: string;
  member_code: string;
  date: string;
  wakeup_status: "success" | "fail";
  frog_status: "completed" | "not_completed";
  wakeup_time?: string;
  frog_time?: string;
  note?: string;
  created_at: string;
}

export default function WakeupPage() {
  const [memberCode, setMemberCode] = useState("");
  const [memberName, setMemberName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [todayLog, setTodayLog] = useState<WakeupLog | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const router = useRouter();

  useEffect(() => {
    // 현재 시간 업데이트 (1초마다)
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // 권한 확인
    if (typeof window !== "undefined") {
      const admin = localStorage.getItem("is_admin") === "true";
      const code = localStorage.getItem("member_code");
      setIsAdmin(admin);
      
      if (!admin && !code) {
        router.push("/login");
        return;
      }
      
      if (code) {
        setMemberCode(code);
        // 멤버 이름 가져오기 (간단한 구현)
        setMemberName(`멤버 ${code}`);
      }
    }

    // 오늘 날짜의 기상 기록 가져오기
    loadTodayLog();

    return () => clearInterval(timer);
  }, [router]);

  const loadTodayLog = async () => {
    if (!memberCode) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const logs = await getWakeupLogs(memberCode, new Date().getFullYear(), new Date().getMonth() + 1);
      const todayLog = logs.find(log => log.date === today);
      setTodayLog(todayLog || null);
    } catch (error) {
      console.error("오늘 기록 로드 실패:", error);
    }
  };

  const canCompleteWakeup = () => {
    const now = currentTime;
    const hour = now.getHours();
    
    // 00:00 ~ 04:59까지만 기상 완료 가능
    return hour >= 0 && hour < 5;
  };

  const canCompleteFrog = () => {
    // 기상 완료가 되어야 개구리 잡기 완료 가능
    return todayLog?.wakeup_status === "success";
  };

  const handleWakeupComplete = async () => {
    if (!canCompleteWakeup()) {
      setMessage("기상 완료는 00:00 ~ 04:59 사이에만 가능합니다.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      
      // 기상 완료 기록 저장 (점수 1점)
      await addWakeupLog(
        memberCode,
        today,
        "success",
        todayLog?.frog_status || "not_completed",
        now.toISOString(),
        todayLog?.frog_time,
        todayLog?.note || "기상 완료"
      );

      setMessage("✅ 기상 완료! 점수 1점 획득!");
      
      // 기록 새로고침
      await loadTodayLog();
      
      // 3초 후 메시지 제거
      setTimeout(() => setMessage(""), 3000);
      
    } catch (error: any) {
      console.error("기상 완료 실패:", error);
      setMessage(`❌ 기상 완료 실패: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFrogComplete = async () => {
    if (!canCompleteFrog()) {
      setMessage("기상 완료 후에만 개구리 잡기를 완료할 수 있습니다.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      
      // 개구리 잡기 완료 기록 저장 (점수 1점)
      await addWakeupLog(
        memberCode,
        today,
        todayLog?.wakeup_status || "success",
        "completed",
        todayLog?.wakeup_time,
        now.toISOString(),
        todayLog?.note || "개구리 잡기 완료"
      );

      setMessage("✅ 개구리 잡기 완료! 점수 1점 획득!");
      
      // 기록 새로고침
      await loadTodayLog();
      
      // 3초 후 메시지 제거
      setTimeout(() => setMessage(""), 3000);
      
    } catch (error: any) {
      console.error("개구리 잡기 완료 실패:", error);
      setMessage(`❌ 개구리 잡기 완료 실패: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusText = () => {
    if (!todayLog) return "오늘 아직 기록이 없습니다.";
    
    let status = "";
    if (todayLog.wakeup_status === "success") {
      status += "✅ 기상 완료";
    }
    if (todayLog.frog_status === "completed") {
      status += status ? " + 🐸 개구리 잡기 완료" : "🐸 개구리 잡기 완료";
    }
    
    return status || "기록 없음";
  };

  const getTotalScore = () => {
    if (!todayLog) return 0;
    
    let score = 0;
    if (todayLog.wakeup_status === "success") score += 1;
    if (todayLog.frog_status === "completed") score += 1;
    
    return score;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">기상 체크</h1>
          <p className="text-gray-600">매일 새벽 기상과 개구리 잡기를 완료하세요!</p>
        </div>

        {/* 현재 시간 표시 */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6 text-center">
          <div className="text-2xl font-mono text-gray-900 mb-2">
            {formatTime(currentTime)}
          </div>
          <div className="text-sm text-gray-500">
            {currentTime.toLocaleDateString('ko-KR', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              weekday: 'long'
            })}
          </div>
        </div>

        {/* 멤버 정보 */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">멤버 정보</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">멤버 코드</label>
              <div className="text-lg font-mono text-gray-900">{memberCode}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">멤버 이름</label>
              <div className="text-lg text-gray-900">{memberName}</div>
            </div>
          </div>
        </div>

        {/* 기상 완료 버튼 */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🌅 기상 완료</h2>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p>• <strong>시간 제한:</strong> 00:00 ~ 04:59</p>
              <p>• <strong>점수:</strong> 1점</p>
              <p>• <strong>현재 상태:</strong> {canCompleteWakeup() ? "✅ 가능" : "❌ 불가능"}</p>
            </div>
            
            <button
              onClick={handleWakeupComplete}
              disabled={!canCompleteWakeup() || loading || todayLog?.wakeup_status === "success"}
              className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all ${
                canCompleteWakeup() && todayLog?.wakeup_status !== "success"
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {todayLog?.wakeup_status === "success" 
                ? "✅ 이미 기상 완료됨" 
                : canCompleteWakeup() 
                  ? "🌅 기상 완료하기" 
                  : "⏰ 기상 시간이 아닙니다"
              }
            </button>
          </div>
        </div>

        {/* 개구리 잡기 완료 버튼 */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🐸 개구리 잡기 완료</h2>
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p>• <strong>조건:</strong> 기상 완료 후 가능</p>
              <p>• <strong>시간:</strong> 제한 없음</p>
              <p>• <strong>점수:</strong> 1점</p>
              <p>• <strong>현재 상태:</strong> {canCompleteFrog() ? "✅ 가능" : "❌ 기상 완료 필요"}</p>
            </div>
            
            <button
              onClick={handleFrogComplete}
              disabled={!canCompleteFrog() || loading || todayLog?.frog_status === "completed"}
              className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all ${
                canCompleteFrog() && todayLog?.frog_status !== "completed"
                  ? "bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {todayLog?.frog_status === "completed" 
                ? "✅ 이미 개구리 잡기 완료됨" 
                : canCompleteFrog() 
                  ? "🐸 개구리 잡기 완료하기" 
                  : "⏳ 기상 완료 후 가능"
              }
            </button>
          </div>
        </div>

        {/* 오늘의 기록 */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 오늘의 기록</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">상태:</span>
              <span className="font-medium">{getStatusText()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">오늘 점수:</span>
              <span className="text-2xl font-bold text-blue-600">{getTotalScore()}/2점</span>
            </div>
            {todayLog?.wakeup_time && (
              <div className="flex justify-between items-center">
                <span className="text-gray-700">기상 시간:</span>
                <span className="font-mono">{new Date(todayLog.wakeup_time).toLocaleTimeString('ko-KR')}</span>
              </div>
            )}
            {todayLog?.frog_time && (
              <div className="flex justify-between items-center">
                <span className="text-gray-700">개구리 잡기 시간:</span>
                <span className="font-mono">{new Date(todayLog.frog_time).toLocaleTimeString('ko-KR')}</span>
              </div>
            )}
          </div>
        </div>

        {/* 메시지 표시 */}
        {message && (
          <div className={`p-4 rounded-lg text-center font-medium ${
            message.includes("✅") 
              ? "bg-green-100 text-green-800 border-2 border-green-300" 
              : "bg-red-100 text-red-800 border-2 border-red-300"
          }`}>
            {message}
          </div>
        )}

        {/* 안내 */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <h3 className="font-semibold text-blue-900 mb-2">💡 점수 시스템 안내</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• <strong>기상 완료:</strong> 00:00 ~ 04:59 사이 완료 시 1점</p>
            <p>• <strong>개구리 잡기:</strong> 기상 완료 후 언제든 완료 시 1점</p>
            <p>• <strong>일일 최대:</strong> 2점 (기상 1점 + 개구리 1점)</p>
            <p>• <strong>점수 반영:</strong> 실시간으로 대시보드와 Supabase에 저장</p>
          </div>
        </div>
      </div>
    </div>
  );
}


