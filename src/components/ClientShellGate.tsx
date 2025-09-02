"use client";

import { usePathname } from "next/navigation";
import AppShell from "@/components/AppShell";

export default function ClientShellGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const noShell = pathname === "/" || pathname?.startsWith("/login");
  if (noShell) return <>{children}</>;
  return <AppShell>{children}</AppShell>;
}


