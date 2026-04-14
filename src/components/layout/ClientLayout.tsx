"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { MainLayout } from "@/components/layout/AppSidebar";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  
  const pagesWithoutSidebar = ["/", "/privacy", "/terms", "/login", "/signup", "/forgot-password", "/reset-password"];

  let showSidebar = !pagesWithoutSidebar.includes(pathname);

  // Hide sidebar on About page for guests
  if (pathname === "/about" && !user) {
    showSidebar = false;
  }

  // Hide entirely if it starts with read/story or info, if you don't want sidebar there
  if (pathname.startsWith("/info/") || pathname.startsWith("/story/")) {
    showSidebar = false;
  }

  return <MainLayout showSidebar={showSidebar}>{children}</MainLayout>;
}
