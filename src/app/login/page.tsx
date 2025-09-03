"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // 모바일 감지
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setError("사용자명과 비밀번호를 입력해주세요.");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      // 관리자 로그인 확인
      if (username === "mnj510" && password === "asdf6014!!") {
        localStorage.setItem("is_admin", "true");
        localStorage.removeItem("member_code");
        router.push("/dashboard");
        return;
      }

      // 일반 멤버 로그인 시도
      const { data, error: memberError } = await supabaseClient
        .from('members')
        .select('code, name')
        .eq('code', username.trim())
        .eq('name', password.trim())
        .single();

      if (memberError || !data) {
        throw new Error("관리자 아이디 또는 비밀번호가 올바르지 않습니다");
      }

      // 멤버 로그인 성공
      localStorage.setItem("member_code", data.code);
      localStorage.removeItem("is_admin");
      router.push("/dashboard");

    } catch (err: any) {
      console.error("로그인 실패:", err);
      setError(err.message || "로그인에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">행동모임 새벽 기상</h1>
          <p className="text-gray-600">관리자 로그인 또는 멤버 코드 로그인</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                사용자명
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="사용자명을 입력하세요"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="비밀번호를 입력하세요"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </button>
          </form>

          {/* 에러 메시지 */}
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* PC에서만 관리자 정보 표시 */}
          {!isMobile && (
            <>
              {/* 안내 */}
              <div className="mt-6 p-4 bg-blue-50 rounded-md">
                <h3 className="text-sm font-medium text-blue-800 mb-2">💡 로그인 안내</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 관리자: mnj510 / asdf6014!!</li>
                  <li>• 일반 멤버: 관리자에게 코드를 요청하세요</li>
                  <li>• 모든 데이터는 Supabase에 안전하게 저장됩니다</li>
                </ul>
              </div>

              {/* 모바일 로그인 링크 */}
              <div className="mt-6 text-center">
                <a
                  href="/mobile-login"
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  📱 모바일 로그인으로 이동
                </a>
              </div>
            </>
          )}

          {/* 모바일에서만 표시되는 간단한 안내 */}
          {isMobile && (
            <div className="mt-6 p-4 bg-blue-50 rounded-md">
              <h3 className="text-sm font-medium text-blue-800 mb-2">💡 로그인 안내</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 관리자 또는 일반 멤버로 로그인하세요</li>
                <li>• 모든 데이터는 Supabase에 안전하게 저장됩니다</li>
                <li>• 모바일에서도 모든 기능을 사용할 수 있습니다</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


