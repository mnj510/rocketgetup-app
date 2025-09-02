"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"member" | "admin">("member");
  const [memberCode, setMemberCode] = useState("");
  const [adminId, setAdminId] = useState("");
  const [adminPw, setAdminPw] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loginMember(e: React.FormEvent) {
    e.preventDefault();
    setLoading("member");
    setError(null);
    try {
      if (!memberCode.trim()) throw new Error("멤버 코드를 입력하세요");
      localStorage.setItem("member_code", memberCode.trim());
      localStorage.removeItem("is_admin");
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message ?? "로그인 실패");
    } finally {
      setLoading(null);
    }
  }

  async function loginAdmin(e: React.FormEvent) {
    e.preventDefault();
    setLoading("admin");
    setError(null);
    try {
      const validId = "mnj510";
      const validPw = "asdf6014!!";
      if (adminId.trim() !== validId || adminPw !== validPw) {
        throw new Error("관리자 아이디 또는 비밀번호가 올바르지 않습니다");
      }
      localStorage.setItem("is_admin", "true");
      localStorage.removeItem("member_code");
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message ?? "관리자 로그인 실패");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">행동모임 새벽 기상</h1>
        <p className="text-gray-600 mt-1">관리자 로그인 또는 멤버 코드 로그인</p>
      </div>

      <div className="max-w-xl mx-auto">
        <div className="flex mb-6 rounded-lg border overflow-hidden">
          <button
            onClick={() => setTab("member")}
            className={`flex-1 py-3 font-medium ${
              tab === "member"
                ? "bg-indigo-500 text-white"
                : "bg-white text-gray-900 dark:bg-gray-200 dark:text-gray-900"
            }`}
          >
            멤버
          </button>
          <button
            onClick={() => setTab("admin")}
            className={`flex-1 py-3 font-medium ${
              tab === "admin"
                ? "bg-indigo-500 text-white"
                : "bg-white text-gray-900 dark:bg-gray-200 dark:text-gray-900"
            }`}
          >
            관리자
          </button>
        </div>

        {tab === "member" ? (
          <form onSubmit={loginMember} className="rounded-lg border p-6 space-y-4">
            <h2 className="font-semibold text-lg">멤버 코드 로그인</h2>
            <input
              className="w-full rounded border px-3 py-2"
              placeholder="멤버 코드"
              value={memberCode}
              onChange={(e) => setMemberCode(e.target.value)}
            />
            <button
              disabled={loading === "member"}
              className="w-full rounded bg-blue-600 text-white py-2 disabled:opacity-50"
            >
              {loading === "member" ? "확인 중..." : "로그인"}
            </button>
          </form>
        ) : (
          <form onSubmit={loginAdmin} className="rounded-lg border p-6 space-y-4">
            <h2 className="font-semibold text-lg">관리자 로그인</h2>
            <input
              className="w-full rounded border px-3 py-2"
              placeholder="아이디"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
            />
            <input
              className="w-full rounded border px-3 py-2"
              type="password"
              placeholder="비밀번호"
              value={adminPw}
              onChange={(e) => setAdminPw(e.target.value)}
            />
            <button
              disabled={loading === "admin"}
              className="w-full rounded bg-black text-white py-2 disabled:opacity-50"
            >
              {loading === "admin" ? "확인 중..." : "관리자 로그인"}
            </button>
          </form>
        )}
      </div>

      {error && <p className="text-red-600 text-sm mt-4 text-center">{error}</p>}
      </div>
    </div>
  );
}


