"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dices, Goal, Home, Receipt, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function BottomNav() {
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    let channel: any;

    async function loadCount() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count } = await supabase
        .from("bets")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "pending");

      setPendingCount(count || 0);
    }

    loadCount();

    // Real-time subscription for updates
    const setupRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel("bottom-nav-bets")
        .on("postgres_changes", 
          { event: "*", schema: "public", table: "bets", filter: `user_id=eq.${user.id}` },
          () => loadCount()
        )
        .subscribe();
    };

    setupRealtime();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  const tabs = [
    { href: "/sports/football", label: "Sports", icon: Goal },
    { href: "/games", label: "Games", icon: Dices },
    { href: "/my-bets", label: "My Bets", icon: Receipt, badge: pendingCount },
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
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-wb-primary text-[9px] font-bold text-black">
                      {tab.badge > 9 ? "9+" : tab.badge}
                    </span>
                  )}
                </div>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}