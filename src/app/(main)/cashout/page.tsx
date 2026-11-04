"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useUserStore } from "@/store/userStore";
import { Loader2, DollarSign } from "lucide-react";

export default function CashOutPage() {
  const symbol = useUserStore((s) => s.symbol);
  const setBalances = useUserStore((s) => s.setBalances);
  const [bets, setBets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cashingOut, setCashingOut] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data } = await supabase.from("bets")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
        
      if (data) {
        // Calculate mock cash-out value based on math (e.g., 80% of potential win)
        const withCashout = data.map(bet => ({
          ...bet,
          cashout_value: (Number(bet.potential_win) * 0.80).toFixed(2)
        }));
        setBets(withCashout);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleCashout(betId: number, cashoutValue: number) {
    setCashingOut(betId);
    try {
      const res = await fetch("/api/bets/cashout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ betId }),
      });
      const data = await res.json();
      if (res.ok) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from("profiles").select("available_balance, withdrawable_balance").eq("id", user.id).single();
          if (profile) setBalances(Number(profile.available_balance), Number(profile.withdrawable_balance));
        }
        setBets(bets.filter(b => b.id !== betId));
        alert(`Cashed out ${symbol}${cashoutValue} successfully!`);
      } else {
        alert(data.error);
      }
    } catch {
      alert("Cashout failed.");
    } finally {
      setCashingOut(null);
    }
  }

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-wb-primary" /></div>;

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Cash Out</h1>
      <div className="space-y-3">
        {bets.length === 0 ? (
          <p className="text-center py-10 text-wb-muted">No open bets to cash out.</p>
        ) : (
          bets.map((bet) => (
            <div key={bet.id} className="rounded-xl border border-wb-border bg-wb-surface p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-wb-primary">{bet.booking_code}</p>
                <p className="text-sm text-white">Stake: {symbol} {Number(bet.stake).toFixed(2)}</p>
                <p className="text-xs text-wb-muted">Win: {symbol} {Number(bet.potential_win).toFixed(2)}</p>
              </div>
              <button
                onClick={() => handleCashout(bet.id, Number(bet.cashout_value))}
                disabled={cashingOut === bet.id}
                className="flex flex-col items-center justify-center rounded-xl bg-wb-primary px-6 py-2 text-black hover:bg-wb-primary-hover disabled:opacity-50"
              >
                <span className="text-[10px] font-bold uppercase">Cash Out</span>
                <span className="text-sm font-black">{symbol} {bet.cashout_value}</span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
