"use client";

import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  const hideOn = ["/login", "/onboarding"];
  const hidden = hideOn.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (hidden) return null;

  return (
    <header className="site-header">
      <img src="/logo.svg" alt="Loomis Chaffee" className="site-wordmark" />
    </header>
  );
}

