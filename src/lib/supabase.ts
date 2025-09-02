"use client";

import { createClient } from "@supabase/supabase-js";

export type Database = any; // TODO: 이후 Supabase 생성 후 types 생성하여 대체

// Supabase 연결 정보 - 정확한 URL과 키
const supabaseUrl = "https://vrrerrvcywqarirnxptr.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZycmVycnZjeXdxYXJscm54cHRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MTY5MzIsImV4cCI6MjA3MjM5MjkzMn0.eUB3YqdAzeLaiwcsSd3Zn_jTUTNRgEMCeTvSG7Wuqso";

console.log("🔧 Supabase 클라이언트 초기화:", { 
  url: supabaseUrl, 
  hasKey: !!supabaseAnonKey,
  keyLength: supabaseAnonKey?.length 
});

// Supabase 클라이언트 생성
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// 연결 테스트
console.log("🔧 Supabase 연결 테스트 시작...");
supabaseClient.from('members').select('count', { count: 'exact', head: true }).then(
  (result) => {
    if (result.error) {
      console.error("❌ Supabase 연결 실패:", result.error);
    } else {
      console.log("✅ Supabase 연결 성공:", result);
    }
  },
  (error) => {
    console.error("❌ Supabase 연결 오류:", error);
  }
);



