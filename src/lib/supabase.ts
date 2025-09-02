"use client";

import { createClient } from "@supabase/supabase-js";

export type Database = any; // TODO: 이후 Supabase 생성 후 types 생성하여 대체

// 환경변수에서 가져오거나 하드코딩된 값 사용
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://vrrerrvcywqarirnxptr.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZycmVycnZjeXdxYXJscm54cHRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MTY5MzIsImV4cCI6MjA3MjM5MjkzMn0.eUB3YqdAzeLaiwcsSd3Zn_jTUTNRgEMCeTvSG7Wuqso";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("[supabase] Supabase 연결 정보가 설정되지 않았습니다.");
}

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);



