"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabaseClient } from "@/lib/supabase";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [sideOpen, setSideOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [memberCode, setMemberCode] = useState("");
  const [memberName, setMemberName] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    // localStorage에서 사용자 정보 가져오기
    const storedIsAdmin = localStorage.getItem("is_admin") === "true";
    const storedMemberCode = localStorage.getItem("member_code") || "";
    
    setIsAdmin(storedIsAdmin);
    setMemberCode(storedMemberCode);

    // 멤버 이름 가져오기
    if (storedMemberCode) {
      getMemberName(storedMemberCode);
    }
  }, []);

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

  const handleLogout = () => {
    localStorage.removeItem("is_admin");
    localStorage.removeItem("member_code");
    window.location.href = "/login";
  };

  const MENU_ITEMS: Array<{ href: string; label: string; adminOnly?: boolean; memberOnly?: boolean; icon?: string }> = [
    { href: "/dashboard", label: "대시보드", icon: "📊" },
    { href: "/wakeup", label: "기상 체크", memberOnly: true, icon: "⏰" },
    { href: "/must", label: "MUST 작성", memberOnly: true, icon: "📝" },
    { href: "/admin", label: "멤버 추가", adminOnly: true, icon: "👥" },
    { href: "/admin/wakeup", label: "기상 체크", adminOnly: true, icon: "⏰" },
    { href: "/admin/must", label: "MUST 관리", adminOnly: true, icon: "📝" },
  ];

  const filteredMenuItems = MENU_ITEMS.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.memberOnly && isAdmin) return false;
    return true;
  });

  // 모바일에서는 상단 메뉴, PC에서는 좌측 메뉴
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024; // 1024px 미만을 모바일로 간주

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* 모바일 상단 헤더 */}
        <header className="bg-white shadow-lg sticky top-0 z-50">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSideOpen(!sideOpen)}
                  className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <h1 className="text-lg font-semibold text-gray-900">행동모임 새벽 기상</h1>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">
                  {isAdmin ? "관리자" : (memberName || memberCode)}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-800 font-medium text-sm px-2 py-1 rounded border border-red-200 hover:bg-red-50"
                >
                  로그아웃
                </button>
              </div>
            </div>
          </div>

          {/* 모바일 상단 메뉴 */}
          <div className={`px-4 pb-3 ${sideOpen ? 'block' : 'hidden'}`}>
            <nav className="grid grid-cols-2 gap-2">
              {filteredMenuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`p-3 rounded-md text-sm font-medium transition-colors text-center ${
                    pathname === item.href
                      ? "bg-indigo-100 text-indigo-700 border-2 border-indigo-300"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100 border border-gray-200"
                  }`}
                  onClick={() => setSideOpen(false)}
                >
                  <div className="text-lg mb-1">{item.icon}</div>
                  <div>{item.label}</div>
                </Link>
              ))}
            </nav>
            
            {/* 모바일 메뉴 안내 */}
            <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600 text-center">
              {isAdmin ? "관리자 모드: 모든 기능 사용 가능" : "멤버 모드: 기본 기능 사용"}
            </div>
          </div>
        </header>

        {/* 모바일 메인 콘텐츠 */}
        <main className="p-4">
          {children}
        </main>
      </div>
    );
  }

  // PC 레이아웃
  return (
    <div className="min-h-screen bg-gray-50">
      {/* PC 헤더 */}
      <header className="bg-white shadow-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">행동모임 새벽 기상</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {isAdmin ? "관리자" : (memberName || memberCode)}
              </span>
              <button
                onClick={handleLogout}
                className="text-red-600 hover:text-red-800 font-medium text-sm"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* PC 좌측 사이드바 */}
        <aside className="w-64 bg-white shadow-xl min-h-screen">
          <nav className="mt-8">
            <div className="px-4 space-y-2">
              {filteredMenuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? "bg-indigo-100 text-indigo-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        </aside>

        {/* PC 메인 콘텐츠 */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}


