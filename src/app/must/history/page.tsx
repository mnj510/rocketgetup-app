"use client";

import { useMemo, useState } from "react";

export default function MustHistoryPage() {
  const [date, setDate] = useState(() => new Date());
  const dateStr = useMemo(() => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [date]);

  function formatYMD(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  const code = typeof window !== 'undefined' ? localStorage.getItem('member_code') || 'guest' : 'guest';
  const recordKey = `must:${code}:${formatYMD(date)}`;
  const recordRaw = typeof window !== 'undefined' ? localStorage.getItem(recordKey) : null;
  const record = (() => {
    if (!recordRaw) return null;
    try { return JSON.parse(recordRaw); } catch { return null; }
  })();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">MUST 기록</h1>
      <div className="flex items-center gap-2">
        <input
          type="date"
          className="rounded border px-3 py-2"
          value={dateStr}
          onChange={(e) => {
            const [yy, mm, dd] = e.target.value.split("-").map(Number);
            setDate(new Date(yy, (mm || 1) - 1, dd || 1));
          }}
        />
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            function formatShort(d: Date) {
              const yy = String(d.getFullYear()).slice(-2);
              const mm = String(d.getMonth() + 1).padStart(2, "0");
              const dd = String(d.getDate()).padStart(2, "0");
              return `${yy}${mm}${dd}`;
            }
            const membersRaw = typeof window !== 'undefined' ? localStorage.getItem('members') : null;
            let name = code;
            try {
              if (membersRaw) {
                const list = JSON.parse(membersRaw) as Array<{ name: string; code: string }>;
                const f = list.find((m) => m.code === code);
                if (f) name = f.name;
              }
            } catch {}
            let text = `${formatShort(new Date(date))} ${name}\n\n`;
            const pri = (record?.priorities || ["", "", "", "", ""]).filter(Boolean);
            const frogs = (record?.frogs || ["", "", ""]).filter(Boolean);
            if (pri.length) text += `[우선순위 MUST]\n${pri.map((p:string,i:number)=>`${i+1}. ${p}`).join('\n')}\n\n`;
            if (frogs.length) text += `[개구리]\n${frogs.map((p:string,i:number)=>`🐸 ${i+1}. ${p}`).join('\n')}\n\n`;
            text += `[${formatShort(new Date(date))} 하루 복기]\n${record?.retro || ''}`;
            navigator.clipboard.writeText(text.trim()).then(()=>alert('복사되었습니다.')).catch(()=>alert('복사 실패'));
          }}
        >복사</button>
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


