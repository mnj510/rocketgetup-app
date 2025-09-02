"use client";

import { useEffect, useMemo, useState } from "react";

function formatTime(date: Date) {
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export default function WakeupPage() {
  const [now, setNow] = useState(new Date());
  const [status, setStatus] = useState<"idle" | "waking" | "done">("idle");

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const dateLine = useMemo(() => {
    return new Intl.DateTimeFormat("ko", {
      dateStyle: "full",
    }).format(now);
  }, [now]);

  function onWakeup() {
    const now = new Date();
    const deadline = new Date();
    deadline.setHours(4, 59, 59, 999); // 04:59:59까지 인정
    if (now <= deadline) {
      setStatus("waking");
      // 기록 및 점수 +1 (중복 방지)
      const code = typeof window !== 'undefined' ? localStorage.getItem('member_code') || 'guest' : 'guest';
      const ym = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
      const ymd = `${ym}-${String(now.getDate()).padStart(2,'0')}`;
      const wakeKey = `wake:${code}:${ymd}`;
      const scoreKey = `score:${code}:${ym}`;
      try {
        // 저장 (성공)
        localStorage.setItem(wakeKey, JSON.stringify({ status: 'success', at: now.toISOString() }));
        // 점수 버킷 업데이트 (하루 1점)
        const raw = localStorage.getItem(scoreKey);
        let bucket: any = { must: 0, wake: 0, lastWake: {} };
        if (raw) { try { bucket = JSON.parse(raw); } catch {} }
        if (!bucket.lastWake || bucket.lastWake[ymd] !== true) {
          bucket.wake = (bucket.wake || 0) + 1;
          if (!bucket.lastWake) bucket.lastWake = {};
          bucket.lastWake[ymd] = true;
        }
        localStorage.setItem(scoreKey, JSON.stringify(bucket));
      } catch {}
    } else {
      setStatus("idle");
      // 실패 기록 (선택 사항)
      const code = typeof window !== 'undefined' ? localStorage.getItem('member_code') || 'guest' : 'guest';
      const now2 = new Date();
      const ym = `${now2.getFullYear()}-${String(now2.getMonth()+1).padStart(2,'0')}`;
      const ymd = `${ym}-${String(now2.getDate()).padStart(2,'0')}`;
      const wakeKey = `wake:${code}:${ymd}`;
      try { localStorage.setItem(wakeKey, JSON.stringify({ status: 'fail', at: now2.toISOString() })); } catch {}
      alert("새벽 05:00 이후에는 기상 점수가 인정되지 않습니다. (기상 실패)");
    }
  }

  function onDoneFrog() {
    setStatus("done");
    // TODO: 개구리 완료 시 점수 +1
  }

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-6">
      <div className="rounded-lg bg-white shadow p-8 text-center">
        <div className="text-5xl font-bold text-indigo-500">{formatTime(now)}</div>
        <div className="text-gray-600 mt-2">{dateLine}</div>
        <div className="mt-6 flex items-center justify-center gap-4">
          <button onClick={onWakeup} className="px-6 py-3 rounded bg-green-600 text-white">기상 완료</button>
          <button onClick={onDoneFrog} className="px-6 py-3 rounded bg-rose-600 text-white">개구리 완료</button>
        </div>
        <div className="mt-6">
          {status === "waking" && (
            <div className="rounded bg-amber-50 text-amber-700 p-3">개구리 잡는 중...</div>
          )}
          {status === "done" && (
            <div className="rounded bg-emerald-50 text-emerald-700 p-3">축하합니다! 점수 1점이 추가되었습니다. 작성 내용을 캡쳐해 기상방에 공유해주세요.</div>
          )}
        </div>
      </div>
    </div>
  );
}


