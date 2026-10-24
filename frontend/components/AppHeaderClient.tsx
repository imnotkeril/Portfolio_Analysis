"use client";

import { usePathname } from "next/navigation";
import { AppHeader } from "./AppHeader";

export function AppHeaderClient() {
  const pathname = usePathname() || "/";
  return <AppHeader active={pathname === "/" ? "/" : pathname} />;
}
