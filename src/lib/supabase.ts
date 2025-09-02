"use client";

import { createClient } from "@supabase/supabase-js";

export type Database = any; // TODO: 이후 Supabase 생성 후 types 생성하여 대체

// Supabase 연결 정보 - 하드코딩
const supabaseUrl = "https://vrrerrvcywqarirnxptr.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZycmVycnZjeXdxYXJscm54cHRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MTY5MzIsImV4cCI6MjA3MjM5MjkzMn0.eUB3YqdAzeLaiwcsSd3Zn_jTUTNRgEMCeTvSG7Wuqso";

console.log("🔧 Supabase 설정:", { 
  url: supabaseUrl, 
  hasKey: !!supabaseAnonKey 
});

export const supabaseClient = createClient<Database>(
  supabaseUrl || "",
  supabaseAnonKey || ""
);



