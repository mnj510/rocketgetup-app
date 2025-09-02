"use client";

import { useMemo, useState } from "react";

export default function MustWritePage() {
  const [priorities, setPriorities] = useState(["", "", "", "", ""]);
  const [frogs, setFrogs] = useState(["", "", ""]);
  const [retro, setRetro] = useState("");
  const [base, setBase] = useState({ priorities: ["", "", "", "", ""], frogs: ["", "", ""], retro: "" });

  const disabled = useMemo(() => {
    const now = new Date();
    const deadline = new Date();
    deadline.setHours(23, 59, 59, 999);
    return now > deadline;
  }, []);

  function formatShort(d: Date) {
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yy}${mm}${dd}`;
  }

  function getMemberName() {
    const code = localStorage.getItem('member_code') || 'guest';
    try {
      const raw = localStorage.getItem('members');
      if (raw) {
        const list = JSON.parse(raw) as Array<{ name: string; code: string }>;
        const m = list.find((x) => x.code === code);
        if (m) return m.name;
      }
    } catch {}
    return code;
  }

  function buildDiffText() {
    const diffPri = priorities
      .map((v, i) => ({ v, i }))
      .filter(({ v, i }) => v && v !== base.priorities[i])
      .map(({ v, i }) => `${i + 1}. ${v}`);
    const diffFrog = frogs
      .map((v, i) => ({ v, i }))
      .filter(({ v, i }) => v && v !== base.frogs[i])
      .map(({ v, i }) => `🐸 ${i + 1}. ${v}`);
    const retroChanged = retro && retro !== base.retro ? retro : "";
    let text = "";
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    text += `${formatShort(tomorrow)} ${getMemberName()}\n\n`;
    if (diffPri.length) {
      text += `[우선순위 MUST]\n${diffPri.join("\n")}\n\n`;
    }
    if (diffFrog.length) {
      text += `[개구리]\n${diffFrog.join("\n")}\n\n`;
    }
    if (retroChanged) {
      text += `[${formatShort(now)} 하루 복기]\n${retroChanged}\n`;
    }
    return text.trim() || "(복사할 내용 없음)";
  }

  function copyDiff() {
    const text = buildDiffText();
    navigator.clipboard.writeText(text).then(() => {
      alert("추가된 내용이 클립보드로 복사되었습니다.");
    }).catch(() => alert("복사에 실패했습니다."));
  }

  function formatYMD(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function formatYM(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }

  function handleSave() {
    const now = new Date();
    const deadline = new Date();
    deadline.setHours(23, 59, 59, 999);
    const code = typeof window !== 'undefined' ? localStorage.getItem('member_code') || 'guest' : 'guest';

    const dateKey = formatYMD(now);
    const ymKey = formatYM(now);
    const recordKey = `must:${code}:${dateKey}`;
    const scoreKey = `score:${code}:${ymKey}`;

    const record = {
      priorities,
      frogs,
      retro,
      createdAt: now.toISOString(),
      scored: false,
    };
    try {
      localStorage.setItem(recordKey, JSON.stringify(record));

      // 23:59:59 이전 저장 시 점수 +1 (중복 방지)
      if (now <= deadline) {
        const existingRaw = localStorage.getItem(recordKey);
        let alreadyScored = false;
        if (existingRaw) {
          try {
            const parsed = JSON.parse(existingRaw);
            alreadyScored = !!parsed.scored;
          } catch {}
        }
        if (!alreadyScored) {
          // update score bucket
          const score = (() => {
            const raw = localStorage.getItem(scoreKey);
            if (!raw) return { must: 0, wake: 0 };
            try { return JSON.parse(raw); } catch { return { must: 0, wake: 0 }; }
          })();
          score.must += 1;
          localStorage.setItem(scoreKey, JSON.stringify(score));
          // mark record scored
          localStorage.setItem(recordKey, JSON.stringify({ ...record, scored: true }));
        }
      }
      alert('저장되었습니다. MUST 기록에서 확인할 수 있어요.');
      // 저장 후 현재 상태를 기준선으로 업데이트(이후 복사는 새로 추가된 것만)
      setBase({ priorities: [...priorities], frogs: [...frogs], retro });
    } catch (e) {
      alert('저장 중 오류가 발생했습니다.');
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">MUST / 개구리 작성</h1>

      <section className="card card-padding space-y-4">
        <h2 className="font-semibold">내일 우선순위 MUST 5가지</h2>
        {priorities.map((v, i) => (
          <input
            key={i}
            className="w-full rounded border px-3 py-2"
            placeholder={`${i + 1}.`}
            value={v}
            onChange={(e) => {
              const next = [...priorities];
              next[i] = e.target.value;
              setPriorities(next);
            }}
          />
        ))}
      </section>

      <section className="card card-padding space-y-4">
        <h2 className="font-semibold">개구리 3가지</h2>
        {frogs.map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            <span>🐸</span>
            <input
              className="flex-1 rounded border px-3 py-2"
              placeholder={`개구리 ${i + 1}`}
              value={v}
              onChange={(e) => {
                const next = [...frogs];
                next[i] = e.target.value;
                setFrogs(next);
              }}
            />
          </div>
        ))}
      </section>

      <section className="card card-padding space-y-3">
        <h2 className="font-semibold">하루 복기</h2>
        <textarea
          className="w-full rounded border px-3 py-2 min-h-[120px]"
          placeholder="오늘 하루를 돌아봅니다."
          value={retro}
          onChange={(e) => setRetro(e.target.value)}
        />
      </section>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={copyDiff} className="btn-primary">복사</button>
        <button disabled={disabled} onClick={handleSave} className="btn-primary disabled:opacity-50">저장</button>
      </div>
    </div>
  );
}


