"use client";

import { useEffect, useState } from "react";
import { nanoid } from "nanoid/non-secure";

interface MemberItem {
  id: string;
  name: string;
  code: string;
}

export default function AdminPage() {
  const [allowed, setAllowed] = useState(false);
  const [name, setName] = useState("");
  const [members, setMembers] = useState<MemberItem[]>([]);

  useEffect(() => {
    setAllowed(localStorage.getItem("is_admin") === "1");
    const raw = localStorage.getItem("members");
    if (raw) {
      setMembers(JSON.parse(raw));
    }
  }, []);

  function persist(next: MemberItem[]) {
    setMembers(next);
    localStorage.setItem("members", JSON.stringify(next));
  }

  function addMember(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const code = nanoid(8);
    const next = [{ id: nanoid(10), name: name.trim(), code }, ...members];
    persist(next);
    setName("");
  }

  function removeMember(id: string) {
    const next = members.filter((m) => m.id !== id);
    persist(next);
  }

  if (!allowed) {
    return <div className="max-w-xl mx-auto py-10">접근 권한이 없습니다. 관리자 로그인 후 이용하세요.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-6">
      <h1 className="text-2xl font-semibold">관리자: 멤버 코드 발급</h1>
      <form onSubmit={addMember} className="flex gap-2">
        <input
          className="flex-1 rounded border px-3 py-2"
          placeholder="이름 입력"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="rounded bg-black text-white px-4">추가</button>
      </form>

      <div className="rounded border">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="p-3">이름</th>
              <th className="p-3">멤버 코드</th>
              <th className="p-3 w-24">삭제</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="border-b">
                <td className="p-3">{m.name}</td>
                <td className="p-3 font-mono">{m.code}</td>
                <td className="p-3">
                  <button onClick={() => removeMember(m.id)} className="rounded bg-rose-600 text-white px-3 py-1">삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-gray-600">발급된 코드를 멤버가 로그인 화면의 "멤버 코드" 입력란에 입력하면 개인 대시보드로 진입합니다.</p>
    </div>
  );
}


