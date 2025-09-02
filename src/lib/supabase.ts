"use client";

import { createClient } from "@supabase/supabase-js";

export type Database = any;

// Supabase 연결 정보 - IP 주소로 직접 설정
const supabaseUrl = "https://vrrerrvcywqarirnxptr.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZycmVycnZjeXdxYXJscm54cHRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MTY5MzIsImV4cCI6MjA3MjM5MjkzMn0.eUB3YqdAzeLaiwcsSd3Zn_jTUTNRgEMCeTvSG7Wuqso";

console.log("🔧 Supabase 설정:", { 
  url: supabaseUrl, 
  hasKey: !!supabaseAnonKey,
  urlType: typeof supabaseUrl
});

// Supabase 클라이언트 생성 - 기본 설정
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// 연결 상태 확인
console.log("🔧 Supabase 클라이언트 생성됨:", !!supabaseClient);



