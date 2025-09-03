"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [sideOpen, setSideOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [memberCode, setMemberCode] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // 모바일 감지
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const admin = localStorage.getItem("is_admin") === "true";
    const code = localStorage.getItem("member_code");
    
    setIsAdmin(admin);
    setMemberCode(code || "");
    
    if (code) {
      getMemberName(code);
    }
  }, []);

  const getMemberName = async (code: string) => {
    try {
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
    router.push("/login");
  };

  const MENU_ITEMS: Array<{ href: string; label: string; adminOnly?: boolean; memberOnly?: boolean }> = [
    { href: "/dashboard", label: "대시보드" },
    { href: "/wakeup", label: "기상 체크", memberOnly: true },
    { href: "/must", label: "MUST 작성", memberOnly: true },
    { href: "/admin", label: "멤버 추가", adminOnly: true },
    { href: "/admin/wakeup", label: "기상 체크", adminOnly: true },
    { href: "/admin/must", label: "MUST 관리", adminOnly: true },
  ];

  const filteredMenuItems = MENU_ITEMS.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.memberOnly && isAdmin) return false;
    return true;
  });

  // 모바일에서는 상단 메뉴, PC에서는 좌측 메뉴
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
                  className="text-red-600 hover:text-red-800 font-medium text-sm"
                >
                  로그아웃
                </button>
              </div>
            </div>
          </div>

          {/* 모바일 상단 메뉴 */}
          <div className={`px-4 pb-3 ${sideOpen ? 'block' : 'hidden'}`}>
            <nav className="flex flex-wrap gap-2">
              {filteredMenuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? "bg-indigo-100 text-indigo-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                  onClick={() => setSideOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        {/* 모바일 메인 콘텐츠 */}
        <main className="p-4">
          {children}
        </main>
      </div>
    );
  }

  // PC 레이아웃 (기존과 동일)
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


