"use client";

import { useEffect, useState } from "react";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/lib/supabase/client";
import { Loader2, Receipt, Search, RefreshCw } from "lucide-react";

export default function MyBetsPage() {
  const symbol = useUserStore((s) => s.symbol);
  const setBalances = useUserStore((s) => s.setBalances);
  const withdrawable = useUserStore((s) => s.withdrawable);

  const [bets, setBets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadCode, setLoadCode] = useState("");
  const [loadedBet, setLoadedBet] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [cashingOutId, setCashingOutId] = useState<number | null>(null);

  async function loadBets() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("bets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    setBets(data || []);
    setLoading(false);
  }

  useEffect(() => { loadBets(); }, []);

  async function handleLoadCode() {
    if (!loadCode.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/bets/load?code=${loadCode.trim().toUpperCase()}`);
      if (res.ok) {
        const data = await res.json();
        setLoadedBet(data.bet);
      } else {
        alert("Bet not found with that code.");
      }
    } catch {
      alert("Error loading bet.");
    } finally {
      setSearching(false);
    }
  }

  async function handleCashout(betId: number) {
    setCashingOutId(betId);
    try {
      const res = await fetch("/api/bets/cashout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ betId }),
      });
      const data = await res.json();
      
      if (res.ok) {
        // Refresh balances from database
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from("profiles").select("available_balance, withdrawable_balance").eq("id", user.id).single();
          if (profile) setBalances(Number(profile.available_balance), Number(profile.withdrawable_balance));
        }
        alert(`Cashed out successfully! ${symbol}${data.cashOutValue.toFixed(2)} credited.`);
        loadBets();
      } else {
        alert(data.error);
      }
    } catch {
      alert("Cashout failed.");
    } finally {
      setCashingOutId(null);
    }
  }

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-wb-primary" /></div>;
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">My Bets</h1>
        <button onClick={loadBets} className="text-wb-muted hover:text-white"><RefreshCw className="h-5 w-5" /></button>
      </div>

      {/* Load Booking Code */}
      <div className="mb-6 rounded-xl border border-wb-border bg-wb-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-wb-muted mb-2">Load Bet by Code</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={loadCode}
            onChange={(e) => setLoadCode(e.target.value.toUpperCase())}
            placeholder="7-letter code"
            maxLength={7}
            className="flex-1 rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-sm text-white placeholder:text-wb-muted focus:border-wb-primary focus:outline-none"
          />
          <button onClick={handleLoadCode} disabled={searching} className="rounded-lg bg-wb-primary px-4 py-2 text-sm font-bold text-black hover:bg-wb-primary-hover disabled:opacity-40">
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Bet History */}
      <div className="space-y-3">
        {bets.length === 0 ? (
          <div className="text-center py-10 text-wb-muted">
            <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No bets yet.</p>
          </div>
        ) : (
          bets.map((bet) => (
            <div key={bet.id} className="rounded-xl border border-wb-border bg-wb-surface p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-wb-primary">{bet.booking_code}</span>
                <span className={`text-xs font-bold ${bet.status === "won" ? "text-wb-primary" : bet.status === "lost" ? "text-wb-danger" : "text-wb-muted"}`}>
                  {bet.status.toUpperCase()}
                </span>
              </div>
              
              <div className="flex justify-between text-sm text-wb-muted mb-3">
                <span>Stake: {symbol} {Number(bet.stake).toFixed(2)}</span>
                <span>Odds: {Number(bet.total_odds).toFixed(2)}</span>
                <span className="text-wb-primary font-semibold">Win: {symbol} {Number(bet.potential_win).toFixed(2)}</span>
              </div>

              {bet.status === "pending" && (
                <button
                  onClick={() => handleCashout(bet.id)}
                  disabled={cashingOutId === bet.id}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-wb-primary/30 bg-wb-primary/10 py-2 text-xs font-bold text-wb-primary hover:bg-wb-primary/20 transition disabled:opacity-50"
                >
                  {cashingOutId === bet.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Cash Out"}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}