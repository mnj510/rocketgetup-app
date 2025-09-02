"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface AppShellProps {
  children: React.ReactNode;
}

const MENU_ITEMS: Array<{ href: string; label: string; adminOnly?: boolean; memberOnly?: boolean }> = [
  { href: "/dashboard", label: "대시보드" },
  { href: "/wakeup", label: "기상 체크" },
  { href: "/must", label: "MUST 작성", memberOnly: true },
  { href: "/admin", label: "관리", adminOnly: true },
];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sideOpen, setSideOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userLabel, setUserLabel] = useState("게스트");

  useEffect(() => {
    setIsAdmin(localStorage.getItem("is_admin") === "1");
    const code = localStorage.getItem("member_code");
    const membersRaw = localStorage.getItem("members");
    let display = "게스트";
    if (localStorage.getItem("is_admin") === "1") {
      display = "관리자";
    } else if (code) {
      let name = code;
      if (membersRaw) {
        try {
          const list = JSON.parse(membersRaw) as Array<{ name: string; code: string }>;
          const found = list.find((m) => m.code === code);
          if (found) name = found.name;
        } catch (_) {}
      }
      display = name;
    }
    setUserLabel(display);
  }, []);

  function logout() {
    localStorage.removeItem("is_admin");
    localStorage.removeItem("member_code");
    router.push("/");
  }

  // 메뉴 필터링: 관리자는 관리 메뉴만, 일반 멤버는 MUST 작성 메뉴 표시
  const filteredMenuItems = MENU_ITEMS.filter((item) => {
    if (item.adminOnly) return isAdmin;
    if (item.memberOnly) return !isAdmin;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div />
          <div className="font-semibold">행동모임 새벽 기상</div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-600">{userLabel}</span>
            <button onClick={logout} className="rounded bg-rose-500 text-white px-3 py-1">로그아웃</button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-[240px_1fr] gap-6">
        <aside className={`sticky self-start top-[64px] h-[calc(100vh-64px)] w-60 bg-white shadow-md p-4 rounded-xl`}>
          <nav className="space-y-1">
            {filteredMenuItems.map((m) => {
              const active = pathname === m.href;
              return (
                <Link key={m.href} href={m.href} className={`block rounded px-3 py-2 ${active ? "bg-indigo-50 text-indigo-700 font-medium" : "hover:bg-gray-100"}`}
                  onClick={() => setSideOpen(false)}
                >
                  {m.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="space-y-6">{children}</main>
      </div>
    </div>
  );
}

export default AppShell;


