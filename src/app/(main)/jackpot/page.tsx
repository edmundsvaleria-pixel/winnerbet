"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useUserStore } from "@/store/userStore";
import { Trophy, Loader2 } from "lucide-react";

export default function JackpotPage() {
  const symbol = useUserStore((s) => s.symbol);
  const [jackpotAmount, setJackpotAmount] = useState(1000000);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("jackpots").select("current_amount").eq("name", "SportyMillions").single();
      if (data) setJackpotAmount(Number(data.current_amount));
      setLoading(false);
    }
    load();

    // Subscribe to real-time changes
    const channel = supabase.channel("jackpot-updates").on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "jackpots" },
      (payload) => {
        if (payload.new && payload.new.current_amount) {
          setJackpotAmount(Number(payload.new.current_amount));
        }
      }
    ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-wb-primary" /></div>;

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-lg mx-auto text-center">
      <div className="mb-8">
        <Trophy className="h-16 w-16 text-wb-primary mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white">SportyMillions Jackpot</h1>
        <p className="text-sm text-wb-muted mt-2">Predict 12 matches correctly to win the pool.</p>
      </div>
      <div className="rounded-3xl border border-wb-primary/30 bg-gradient-to-b from-wb-primary/10 to-wb-surface p-8 mb-8 shadow-2xl shadow-wb-primary/10">
        <p className="text-xs font-bold uppercase tracking-widest text-wb-primary mb-2">Current Prize Pool</p>
        <p className="text-5xl font-black text-white tabular-nums">
          {symbol} {jackpotAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
      </div>
      <button className="w-full rounded-xl bg-wb-primary py-4 text-sm font-bold text-black transition hover:bg-wb-primary-hover">
        Play Jackpot (Min GH₵ 10)
      </button>
    </div>
  );
}