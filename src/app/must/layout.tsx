"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function MustLayout({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    setIsAdmin(localStorage.getItem("is_admin") === "1");
  }, []);

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/must/write" className="rounded-lg bg-indigo-600 text-white px-5 py-2 text-sm font-semibold shadow hover:bg-indigo-700">MUST/개구리 작성</Link>
        <Link href="/must/history" className="rounded-lg bg-indigo-600 text-white px-5 py-2 text-sm font-semibold shadow hover:bg-indigo-700">MUST 기록</Link>
      </div>
      {children}
    </div>
  );
}


