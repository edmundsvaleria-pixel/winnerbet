"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { CURRENCY_SYMBOLS, useUserStore } from "@/store/userStore";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import FloatingBetButton from "@/components/ui/FloatingBetButton";
import BetSlip from "@/components/ui/BetSlip";
import { Loader2 } from "lucide-react";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const setBalances = useUserStore((s) => s.setBalances);
  const setCurrency = useUserStore((s) => s.setCurrency);

  const [ready, setReady] = useState(false);
  const [username, setUsername] = useState("Guest");
  const [role, setRole] = useState("guest");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // If no user, let them browse as a guest
      if (!user) {
        if (!cancelled) setReady(true);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("username, role, currency, available_balance, withdrawable_balance")
        .eq("id", user.id)
        .single();

      if (cancelled) return;

      if (profile) {
        const currency = (profile.currency as string) || "GHS";
        const symbol = CURRENCY_SYMBOLS[currency] ?? "GH₵";

        setCurrency(currency, symbol);
        setBalances(
          Number(profile.available_balance ?? 0),
          Number(profile.withdrawable_balance ?? 0)
        );
        setUsername((profile.username as string) || "player");
        setRole((profile.role as string) || "member");
      }
      
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [setBalances, setCurrency]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-wb-bg">
        <Loader2 className="h-6 w-6 animate-spin text-wb-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-wb-bg">
      <Header username={username} isGuest={role === "guest"} />
      <Sidebar role={role} />

      <main className="pt-16 pb-16 lg:pb-0 lg:pl-60">{children}</main>

      <BottomNav />
      <FloatingBetButton />
      <BetSlip />
    </div>
  );
}