"use client";

import { useEffect, useState } from "react";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/lib/supabase/client";
import { Loader2, Receipt, RefreshCw } from "lucide-react";
import Toast from "@/components/ui/Toast";
import MatchDetailsModal from "@/components/sports/MatchDetailsModal";
import { Match } from "@/lib/bsd";

export default function MyBetsPage() {
  const symbol = useUserStore((s) => s.symbol);
  const setBalances = useUserStore((s) => s.setBalances);

  const [bets, setBets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cashingOutId, setCashingOutId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  
  // State for Match Modal
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [loadingMatch, setLoadingMatch] = useState<number | null>(null);

  async function loadBets() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("bets").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
    setBets(data || []);
    setLoading(false);
  }

  useEffect(() => { loadBets(); }, []);

  // Poll for live cashout values
  useEffect(() => {
    const interval = setInterval(async () => {
      const pending = bets.filter(b => b.status === "pending");
      if (pending.length === 0) return;

      const updatedBets = await Promise.all(pending.map(async (bet) => {
        try {
          const res = await fetch(`/api/bets/cashout-value?betId=${bet.id}`);
          if (res.ok) {
            const data = await res.json();
            return { ...bet, liveCashout: data.cashoutValue };
          }
        } catch (e) {}
        return bet;
      }));

      setBets(prev => prev.map(b => {
        const updated = updatedBets.find(u => u.id === b.id);
        return updated ? updated : b;
      }));
    }, 10000);

    return () => clearInterval(interval);
  }, [bets]);

  async function handleCashout(betId: number, value: number) {
    setCashingOutId(betId);
    try {
      const res = await fetch("/api/bets/cashout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ betId, cashoutValue: value }),
      });
      const data = await res.json();
      if (res.ok) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from("profiles").select("available_balance, withdrawable_balance").eq("id", user.id).single();
          if (profile) setBalances(Number(profile.available_balance), Number(profile.withdrawable_balance));
        }
        setToast({ msg: `Cashed out! ${symbol}${value.toFixed(2)} credited.`, type: "success" });
        loadBets();
      } else {
        setToast({ msg: data.error, type: "error" });
      }
    } catch {
      setToast({ msg: "Cashout failed.", type: "error" });
    } finally {
      setCashingOutId(null);
    }
  }

  // Handle clicking a bet to view the match
  async function handleBetClick(bet: any) {
    if (bet.selections && bet.selections.length > 0) {
      const matchId = bet.selections[0].matchId;
      setLoadingMatch(bet.id);
      
      try {
        const res = await fetch(`/api/live-engine`);
        const matches = await res.json();
        const match = matches.find((m: Match) => m.id === matchId);
        
        if (match) {
          setSelectedMatch(match);
        } else {
          setToast({ msg: "Match details not found.", type: "error" });
        }
      } catch {
        setToast({ msg: "Error loading match details.", type: "error" });
      } finally {
        setLoadingMatch(null);
      }
    }
  }

  // Group bets by status
  const groupedBets = {
    pending: bets.filter(b => b.status === "pending"),
    won: bets.filter(b => b.status === "won"),
    lost: bets.filter(b => b.status === "lost"),
    cashed_out: bets.filter(b => b.status === "cashed_out"),
  };

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-wb-primary" /></div>;

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {selectedMatch && <MatchDetailsModal match={selectedMatch} onClose={() => setSelectedMatch(null)} />}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">My Bets</h1>
        <button onClick={loadBets} className="text-wb-muted hover:text-white"><RefreshCw className="h-5 w-5" /></button>
      </div>

      {/* Grouped Sections */}
      {Object.entries(groupedBets).map(([status, statusBets]) => {
        if (statusBets.length === 0) return null;
        
        const statusLabel = status === "cashed_out" ? "Cashed Out" : status.charAt(0).toUpperCase() + status.slice(1);
        const statusColor = status === "won" ? "text-wb-primary" : status === "lost" ? "text-wb-danger" : status === "cashed_out" ? "text-yellow-500" : "text-wb-muted";

        return (
          <div key={status} className="mb-8">
            <h2 className={`text-sm font-bold uppercase tracking-wider mb-3 ${statusColor}`}>
              {statusLabel} ({statusBets.length})
            </h2>
            <div className="space-y-3">
              {statusBets.map((bet) => (
                <div 
                  key={bet.id} 
                  onClick={() => handleBetClick(bet)}
                  className="rounded-xl border border-wb-border bg-wb-surface p-4 cursor-pointer hover:border-wb-primary/50 transition relative"
                >
                  {loadingMatch === bet.id && (
                    <div className="absolute inset-0 bg-wb-bg/50 flex items-center justify-center z-10 rounded-xl">
                      <Loader2 className="h-5 w-5 animate-spin text-wb-primary" />
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-wb-primary">{bet.booking_code}</span>
                    <span className={`text-xs font-bold ${statusColor}`}>{statusLabel.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-wb-muted mb-3">
                    <span>Stake: {symbol} {Number(bet.stake).toFixed(2)}</span>
                    <span>Odds: {Number(bet.total_odds).toFixed(2)}</span>
                    <span className="text-wb-primary font-semibold">Win: {symbol} {Number(bet.potential_win).toFixed(2)}</span>
                  </div>
                  
                  {bet.status === "pending" && (
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => handleCashout(bet.id, bet.liveCashout || Number(bet.stake) * 0.8)} 
                        disabled={cashingOutId === bet.id} 
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 py-2 text-xs font-bold text-yellow-500 hover:bg-yellow-500/20 transition disabled:opacity-50"
                      >
                        {cashingOutId === bet.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : `Cash Out: ${symbol} ${(bet.liveCashout || Number(bet.stake) * 0.8).toFixed(2)}`}
                      </button>
                    </div>
                  )}

                  {bet.status !== "pending" && (
                    <div className="mt-2 text-center text-[10px] text-wb-muted uppercase tracking-wider">
                      Tap to view match details
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {bets.length === 0 && (
        <div className="text-center py-10 text-wb-muted"><Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>No bets found.</p></div>
      )}
    </div>
  );
}