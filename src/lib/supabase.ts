"use client";

import { createClient } from "@supabase/supabase-js";

export type Database = any;

// Supabase 연결 정보 - 여러 URL 시도
const supabaseUrl = "https://vrrerrvcywqarirnxptr.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZycmVycnZjeXdxYXJscm54cHRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MTY5MzIsImV4cCI6MjA3MjM5MjkzMn0.eUB3YqdAzeLaiwcsSd3Zn_jTUTNRgEMCeTvSG7Wuqso";

console.log("🔧 Supabase 설정:", { 
  url: supabaseUrl, 
  hasKey: !!supabaseAnonKey,
  urlType: typeof supabaseUrl
});

// Supabase 클라이언트 생성
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// 연결 상태 확인
console.log("🔧 Supabase 클라이언트 생성됨:", !!supabaseClient);

// 직접 URL 접근 테스트
console.log("🔧 직접 URL 접근 테스트 시작...");
fetch(supabaseUrl)
  .then(response => {
    console.log("✅ Supabase URL 접근 성공:", response.status);
  })
  .catch(error => {
    console.error("❌ Supabase URL 접근 실패:", error);
    
    // 대안 URL 시도
    const alternativeUrl = "https://vrrerrvcywqarirnxptr.supabase.co/rest/v1/";
    console.log("🔧 대안 URL 시도:", alternativeUrl);
    
    fetch(alternativeUrl)
      .then(response => {
        console.log("✅ 대안 URL 접근 성공:", response.status);
      })
      .catch(altError => {
        console.error("❌ 대안 URL도 실패:", altError);
      });
  });



