"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { verifyMobileLoginCode } from "@/lib/supabase-utils";

export default function MobileLoginPage() {
  const [mobileCode, setMobileCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mobileCode || mobileCode.length !== 6) {
      setMessage("6자리 코드를 입력해주세요.");
      return;
    }

    try {
      setIsLoading(true);
      setMessage("");

      const result = await verifyMobileLoginCode(mobileCode);
      
      if (result.success && result.memberCode) {
        // 로그인 성공
        localStorage.setItem("member_code", result.memberCode);
        localStorage.removeItem("is_admin");
        
        setMessage("로그인 성공! 대시보드로 이동합니다.");
        
        // 1초 후 대시보드로 이동
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      } else {
        setMessage(result.error || "로그인에 실패했습니다.");
      }
    } catch (error: any) {
      console.error("모바일 로그인 실패:", error);
      setMessage("로그인 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">모바일 로그인</h1>
          <p className="text-gray-600">6자리 코드를 입력하여 로그인하세요</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="mobileCode" className="block text-sm font-medium text-gray-700 mb-2">
                모바일 로그인 코드
              </label>
              <input
                id="mobileCode"
                type="text"
                value={mobileCode}
                onChange={(e) => setMobileCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-center text-2xl font-mono tracking-widest"
                required
              />
              <p className="mt-2 text-sm text-gray-500">
                관리자에게 받은 6자리 코드를 입력하세요
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || mobileCode.length !== 6}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </button>
          </form>

          {/* 메시지 표시 */}
          {message && (
            <div className={`mt-4 p-3 rounded-md text-sm ${
              message.includes("성공") 
                ? "bg-green-100 text-green-800" 
                : "bg-red-100 text-red-800"
            }`}>
              {message}
            </div>
          )}

          {/* 안내 */}
          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <h3 className="text-sm font-medium text-blue-800 mb-2">💡 모바일 로그인 안내</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 관리자에게 모바일 로그인 코드를 요청하세요</li>
              <li>• 코드는 24시간 동안 유효합니다</li>
              <li>• 모든 기능을 모바일에서 사용할 수 있습니다</li>
            </ul>
          </div>

          {/* PC 로그인 링크 */}
          <div className="mt-6 text-center">
            <a
              href="/login"
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              PC 로그인으로 이동
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
