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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">행동모임 새벽 기상</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {memberName || memberCode}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* 사이드바 */}
        <aside className={`${sideOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:inset-0 z-50 lg:z-auto lg:w-64 bg-white shadow-xl transition-transform duration-300 ease-in-out lg:transition-none`}>
          <div className="h-full flex flex-col">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <nav className="space-y-1">
                {filteredMenuItems.map((m) => {
                  const active = pathname === m.href;
                  return (
                    <Link key={m.href} href={m.href} className={`block rounded px-3 py-2 ${active ? "bg-indigo-50 text-indigo-700 font-medium" : "hover:bg-gray-100"}`}
                      onClick={() => setSideOpen(false)}
                    >
                      {m.icon && <span className="mr-2">{m.icon}</span>}
                      {m.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </aside>

        {/* 메인 콘텐츠 */}
        <main className="flex-1 lg:ml-64">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* 모바일 메뉴 버튼 */}
      <button
        className="lg:hidden fixed bottom-4 right-4 bg-indigo-600 text-white p-3 rounded-full shadow-lg z-50"
        onClick={() => setSideOpen(!sideOpen)}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>
  );
}


