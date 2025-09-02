"use client";
import { useEffect, useMemo, useState } from "react";
import { redirect } from "next/navigation";

function formatYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function MustAdminOrWrite() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [members, setMembers] = useState<Array<{ name: string; code: string }>>([]);
  const [selectedCode, setSelectedCode] = useState<string>("");
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const admin = localStorage.getItem("is_admin") === "1";
    setIsAdmin(admin);
    try {
      const raw = localStorage.getItem("members");
      if (raw) {
        const list = JSON.parse(raw);
        setMembers(list);
        if (admin && list.length > 0) setSelectedCode(list[0].code);
      }
    } catch {}
  }, []);

  const record = useMemo(() => {
    const key = `must:${selectedCode || localStorage.getItem('member_code') || 'guest'}:${formatYMD(date)}`;
    const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }, [selectedCode, date]);

  if (!isAdmin) {
    // 일반 멤버는 첫 화면을 작성 화면으로 고정
    redirect("/must/write");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">MUST 기록(관리자)</h1>
      <div className="flex items-center gap-3">
        <select
          className="rounded border px-3 py-2"
          value={selectedCode}
          onChange={(e) => setSelectedCode(e.target.value)}
        >
          {members.map((m) => (
            <option key={m.code} value={m.code}>{m.name}</option>
          ))}
        </select>
        <input
          type="date"
          className="rounded border px-3 py-2"
          value={formatYMD(date)}
          onChange={(e) => {
            const [yy, mm, dd] = e.target.value.split('-').map(Number);
            setDate(new Date(yy, (mm || 1) - 1, dd || 1));
          }}
        />
      </div>

      <section className="card card-padding">
        <h2 className="font-semibold mb-2">내일 우선순위 MUST 5가지</h2>
        <ul className="list-disc pl-5 text-sm text-gray-700">
          {(record?.priorities || ["", "", "", "", ""]).map((p: string, i: number) => (
            <li key={i}>{p || "(작성 없음)"}</li>
          ))}
        </ul>
      </section>

      <section className="card card-padding">
        <h2 className="font-semibold mb-2">개구리 3가지</h2>
        <ul className="list-disc pl-5 text-sm text-gray-700">
          {(record?.frogs || ["", "", ""]).map((p: string, i: number) => (
            <li key={i}>{p || "(작성 없음)"}</li>
          ))}
        </ul>
      </section>

      <section className="card card-padding">
        <h2 className="font-semibold mb-2">하루 복기</h2>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{record?.retro || "작성된 데이터가 없습니다."}</p>
      </section>
    </div>
  );
}


