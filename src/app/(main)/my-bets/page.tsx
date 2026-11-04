"use client";

import { useEffect, useState } from "react";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/lib/supabase/client";
import { Loader2, Receipt, Search, RefreshCw, CheckCircle2 } from "lucide-react";
import Toast from "@/components/ui/Toast";

export default function MyBetsPage() {
  const symbol = useUserStore((s) => s.symbol);
  const setBalances = useUserStore((s) => s.setBalances);
  const [bets, setBets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticketId, setTicketId] = useState("");
  const [bookingCode, setBookingCode] = useState("");
  const [searching, setSearching] = useState(false);
  const [cashingOutId, setCashingOutId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  async function loadBets() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("bets").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
    setBets(data || []);
    setLoading(false);
  }

  useEffect(() => { loadBets(); }, []);

  // Poll for live cashout values every 10 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      // Only poll if there are pending bets
      const pending = bets.filter(b => b.status === "pending");
      if (pending.length === 0) return;

      const updatedBets = await Promise.all(pending.map(async (bet) => {
        try {
          const res = await fetch(`/api/bets/cashout-value?betId=${bet.id}`);
          if (res.ok) {
            const data = await res.json();
            return { ...bet, liveCashout: data.cashoutValue, cashoutAvailable: data.available };
          }
        } catch (e) {}
        return bet;
      }));

      // Merge updated live values back into the main bets list
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

  const filteredBets = bets; // Add your filter logic here if needed

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-wb-primary" /></div>;

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">My Bets</h1>
        <button onClick={loadBets} className="text-wb-muted hover:text-white"><RefreshCw className="h-5 w-5" /></button>
      </div>

      <div className="space-y-3">
        {filteredBets.map((bet) => (
          <div key={bet.id} className="rounded-xl border border-wb-border bg-wb-surface p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-wb-primary">{bet.booking_code}</span>
              <span className={`text-xs font-bold ${bet.status === "won" ? "text-wb-primary" : bet.status === "lost" ? "text-wb-danger" : bet.status === "cashed_out" ? "text-yellow-500" : "text-wb-muted"}`}>
                {bet.status.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between text-sm text-wb-muted mb-3">
              <span>Stake: {symbol} {Number(bet.stake).toFixed(2)}</span>
              <span>Odds: {Number(bet.total_odds).toFixed(2)}</span>
              <span className="text-wb-primary font-semibold">Win: {symbol} {Number(bet.potential_win).toFixed(2)}</span>
            </div>
            
            {bet.status === "pending" && (
              <div className="flex gap-2">
                {bet.cashoutAvailable ? (
                  <button 
                    onClick={() => handleCashout(bet.id, bet.liveCashout)} 
                    disabled={cashingOutId === bet.id} 
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 py-2 text-xs font-bold text-yellow-500 hover:bg-yellow-500/20 transition disabled:opacity-50"
                  >
                    {cashingOutId === bet.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : `Cash Out: ${symbol} ${bet.liveCashout?.toFixed(2) || "0.00"}`}
                  </button>
                ) : (
                  <button disabled className="flex-1 rounded-lg bg-wb-surface border border-wb-border py-2 text-xs font-bold text-wb-muted cursor-not-allowed">
                    Cashout Unavailable
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}