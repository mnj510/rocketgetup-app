"use client";

import { createClient } from "@supabase/supabase-js";

export type Database = any; // TODO: 이후 Supabase 생성 후 types 생성하여 대체

// Supabase 연결 정보 - 완전히 새로운 설정
const supabaseUrl = "https://vrrerrvcywqarirnxptr.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZycmVycnZjeXdxYXJscm54cHRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MTY5MzIsImV4cCI6MjA3MjM5MjkzMn0.eUB3YqdAzeLaiwcsSd3Zn_jTUTNRgEMCeTvSG7Wuqso";

console.log("🔧 Supabase 클라이언트 초기화:", { 
  url: supabaseUrl, 
  hasKey: !!supabaseAnonKey,
  keyLength: supabaseAnonKey?.length,
  urlValid: supabaseUrl.startsWith('https://')
});

// Supabase 클라이언트 생성 - 기본 설정으로
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// 연결 테스트 - 간단한 방식으로
console.log("🔧 Supabase 연결 테스트 시작...");
console.log("🔧 테스트 URL:", `${supabaseUrl}/rest/v1/members?select=count&limit=1`);

// 직접 fetch로 테스트
fetch(`${supabaseUrl}/rest/v1/members?select=count&limit=1`, {
  headers: {
    'apikey': supabaseAnonKey,
    'Authorization': `Bearer ${supabaseAnonKey}`
  }
})
.then(response => {
  console.log("✅ 직접 fetch 테스트 성공:", response.status);
  return response.json();
})
.then(data => {
  console.log("✅ 데이터 응답:", data);
})
.catch(error => {
  console.error("❌ 직접 fetch 테스트 실패:", error);
});



