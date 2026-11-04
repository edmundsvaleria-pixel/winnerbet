"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export function useCasinoAccess() {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ deposits: 0, bets: 0 });

  useEffect(() => {
    async function checkAccess() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // 1. Check Deposit Count
      const { data: profile } = await supabase
        .from("profiles")
        .select("deposit_count")
        .eq("id", user.id)
        .single();

      const depositCount = profile?.deposit_count || 0;

      // 2. Check Football Bets Count
      const { count: betCount } = await supabase
        .from("bets")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("sport", "football");

      const footballBets = betCount || 0;

      setStats({ deposits: depositCount, bets: footballBets });
      
      // RULE: Must have 3 deposits AND 3 football bets
      if (depositCount >= 3 && footballBets >= 3) {
        setHasAccess(true);
      }
      setLoading(false);
    }

    checkAccess();
  }, []);

  return { hasAccess, loading, stats };
}