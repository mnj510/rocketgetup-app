"use client";

import { createClient } from "@supabase/supabase-js";

export type Database = any;

// Supabase 연결 정보 - 새로운 프로젝트
const supabaseUrl = "https://dxpcldbdgxytyiioqzrd.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4cGNsZGJkZ3h5dHlpaW9xenJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4NTE3OTksImV4cCI6MjA3MjQyNzc5OX0.NASux7wI7kKtUXvB9-LfDlwsMiVR0lIh4f7r1_IQfEo";

console.log("🔧 Supabase 설정:", { 
  url: supabaseUrl, 
  hasKey: !!supabaseAnonKey,
  urlType: typeof supabaseUrl,
  note: "새로운 Supabase 프로젝트로 연결되었습니다!"
});

// Supabase 클라이언트 생성
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// 연결 상태 확인
console.log("🔧 Supabase 클라이언트 생성됨:", !!supabaseClient);

// 연결 테스트
console.log("🔧 새로운 Supabase 연결 테스트 시작...");
supabaseClient.from('members').select('count', { count: 'exact', head: true }).then(
  (result) => {
    if (result.error) {
      console.log("⚠️ 테이블이 아직 생성되지 않았습니다. 테이블을 생성해주세요.");
    } else {
      console.log("✅ Supabase 연결 성공:", result);
    }
  },
  (error) => {
    console.log("⚠️ 연결은 성공했지만 테이블이 없습니다. 테이블을 생성해주세요.");
  }
);



