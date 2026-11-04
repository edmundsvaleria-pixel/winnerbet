"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dices, Goal, Home, Receipt, Wallet } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();
  const tabs = [
    { href: "/sports/football", label: "Sports", icon: Goal },
    { href: "/games", label: "Games", icon: Dices },
    { href: "/my-bets", label: "My Bets", icon: Receipt },
    { href: "/wallet", label: "Wallet", icon: Wallet },
    { href: "/", label: "Home", icon: Home },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-wb-border bg-wb-bg/95 backdrop-blur pb-safe lg:hidden">
      <ul className="grid h-16 grid-cols-5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = pathname === tab.href || pathname?.startsWith(tab.href + "/");
          return (
            <li key={tab.href}>
              <Link href={tab.href} className={`flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition ${active ? "text-wb-primary" : "text-wb-muted hover:text-white"}`}>
                <Icon className="h-5 w-5" />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}