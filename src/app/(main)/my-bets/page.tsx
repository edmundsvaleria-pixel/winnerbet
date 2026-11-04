"use client";

import { useEffect, useState } from "react";
import { useUserStore } from "@/store/userStore";
import { useBetSlipStore } from "@/store/betSlip";
import { supabase } from "@/lib/supabase/client";
import { Loader2, Receipt, Search, RefreshCw, CheckCircle2, Copy, Ticket } from "lucide-react";
import Toast from "@/components/ui/Toast";
import { useRouter } from "next/navigation";

export default function MyBetsPage() {
  const router = useRouter();
  const symbol = useUserStore((s) => s.symbol);
  const setBalances = useUserStore((s) => s.setBalances);
  
  const clearSlip = useBetSlipStore((s) => s.clearSlip);
  const addSelection = useBetSlipStore((s) => s.addSelection);
  const openSlip = useBetSlipStore((s) => s.openSlip);

  const [bets, setBets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticketId, setTicketId] = useState("");
  const [bookingCode, setBookingCode] = useState("");
  
  const [searchedBet, setSearchedBet] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [cashingOutId, setCashingOutId] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "won" | "lost">("all");
  
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  async function loadBets() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("bets").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
    setBets(data || []);
    setLoading(false);
  }

  useEffect(() => { loadBets(); }, []);

  async function handleTrackTicket() {
    if (!ticketId.trim()) return;
    setSearching(true);
    setSearchedBet(null);
    try {
      const res = await fetch(`/api/bets/track?ticketId=${ticketId.trim()}`);
      const data = await res.json();
      if (res.ok) {
        setSearchedBet(data.bet);
        setToast({ msg: "Ticket loaded successfully.", type: "success" });
      } else {
        setToast({ msg: data.error || "Ticket not found.", type: "error" });
      }
    } catch {
      setToast({ msg: "Error tracking ticket.", type: "error" });
    } finally {
      setSearching(false);
    }
  }

  async function handleLoadBookingCode() {
    if (!bookingCode.trim()) return;
    setSearching(true);
    setSearchedBet(null);
    try {
      const res = await fetch(`/api/bets/load?code=${bookingCode.trim().toUpperCase()}`);
      const data = await res.json();
      if (res.ok) {
        setSearchedBet(data.bet);
        setToast({ msg: "Booking code loaded.", type: "success" });
      } else {
        setToast({ msg: data.error || "Code not found.", type: "error" });
      }
    } catch {
      setToast({ msg: "Error loading code.", type: "error" });
    } finally {
      setSearching(false);
    }
  }

  function handleCopyToSlip() {
    if (!searchedBet || !searchedBet.selections) return;
    clearSlip();
    searchedBet.selections.forEach((sel: any) => {
      addSelection({ matchId: sel.matchId, matchLabel: sel.matchLabel, league: sel.league, market: sel.market, pick: sel.pick, odd: sel.odd });
    });
    openSlip();
    router.push("/sports/football");
  }

  async function handleCashout(betId: number) {
    setCashingOutId(betId);
    try {
      const res = await fetch("/api/bets/cashout", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ betId }),
      });
      const data = await res.json();
      if (res.ok) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase.from("profiles").select("available_balance, withdrawable_balance").eq("id", user.id).single();
          if (profile) setBalances(Number(profile.available_balance), Number(profile.withdrawable_balance));
        }
        setToast({ msg: `Cashed out! ${symbol}${data.cashOutValue.toFixed(2)} credited.`, type: "success" });
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

  const filteredBets = bets.filter(b => filter === "all" || b.status === filter);

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-wb-primary" /></div>;

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">My Bets</h1>
        <button onClick={loadBets} className="text-wb-muted hover:text-white"><RefreshCw className="h-5 w-5" /></button>
      </div>

      {/* Search Bars Grid */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        {/* Ticket ID Tracker */}
        <div className="rounded-xl border border-wb-border bg-wb-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-wb-muted mb-2 flex items-center gap-1"><Ticket className="h-3 w-3"/> Track Ticket ID</p>
          <div className="flex gap-2">
            <input type="text" value={ticketId} onChange={(e) => setTicketId(e.target.value)} placeholder="6-digit ID" maxLength={6} className="flex-1 rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-sm text-white focus:border-wb-primary focus:outline-none" />
            <button onClick={handleTrackTicket} disabled={searching || !ticketId} className="rounded-lg bg-wb-primary px-3 py-2 text-sm font-bold text-black hover:bg-wb-primary-hover disabled:opacity-40">
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Booking Code Loader */}
        <div className="rounded-xl border border-wb-border bg-wb-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-wb-muted mb-2 flex items-center gap-1"><Copy className="h-3 w-3"/> Load Booking Code</p>
          <div className="flex gap-2">
            <input type="text" value={bookingCode} onChange={(e) => setBookingCode(e.target.value.toUpperCase())} placeholder="7-letter code" maxLength={7} className="flex-1 rounded-lg border border-wb-border-strong bg-wb-sub px-3 py-2 text-sm text-white focus:border-wb-primary focus:outline-none" />
            <button onClick={handleLoadBookingCode} disabled={searching || !bookingCode} className="rounded-lg bg-wb-primary px-3 py-2 text-sm font-bold text-black hover:bg-wb-primary-hover disabled:opacity-40">
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Show Searched Bet */}
      {searchedBet && (
        <div className="mb-6 rounded-xl border border-wb-primary/30 bg-wb-primary/5 p-4 animate-fade-up">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-wb-primary" />
              <h3 className="text-sm font-bold text-wb-primary">Found</h3>
            </div>
            <button onClick={handleCopyToSlip} className="flex items-center gap-1 rounded-lg bg-wb-primary px-3 py-1.5 text-xs font-bold text-black hover:bg-wb-primary-hover transition">
              <Copy className="h-3.5 w-3.5" /> Copy to Slip
            </button>
          </div>
          <div className="space-y-1 text-xs">
            <p className="text-white">Ticket ID: <span className="font-bold">{searchedBet.ticket_id || "N/A"}</span></p>
            <p className="text-white">Booking Code: <span className="font-bold">{searchedBet.booking_code}</span></p>
            <p className="text-wb-muted">Stake: {symbol} {Number(searchedBet.stake).toFixed(2)}</p>
            <p className="text-wb-muted">Potential Win: <span className="text-wb-primary font-bold">{symbol} {Number(searchedBet.potential_win).toFixed(2)}</span></p>
            <p className="text-wb-muted">Status: <span className="uppercase font-bold">{searchedBet.status}</span></p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {(["all", "pending", "won", "lost"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition ${filter === f ? "bg-wb-primary text-black" : "bg-wb-surface text-wb-muted hover:text-white"}`}>
            {f}
          </button>
        ))}
      </div>

      {/* History */}
      <div className="space-y-3">
        {filteredBets.length === 0 ? (
          <div className="text-center py-10 text-wb-muted"><Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>No bets found.</p></div>
        ) : (
          filteredBets.map((bet) => (
            <div key={bet.id} className="rounded-xl border border-wb-border bg-wb-surface p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-wb-primary">{bet.booking_code}</span>
                  <span className="text-[10px] text-wb-muted bg-wb-bg px-2 py-0.5 rounded border border-wb-border">ID: {bet.ticket_id || "N/A"}</span>
                </div>
                <span className={`text-xs font-bold ${bet.status === "won" ? "text-wb-primary" : bet.status === "lost" ? "text-wb-danger" : "text-wb-muted"}`}>{bet.status.toUpperCase()}</span>
              </div>
              <div className="flex justify-between text-sm text-wb-muted mb-3">
                <span>Stake: {symbol} {Number(bet.stake).toFixed(2)}</span>
                <span>Odds: {Number(bet.total_odds).toFixed(2)}</span>
                <span className="text-wb-primary font-semibold">Win: {symbol} {Number(bet.potential_win).toFixed(2)}</span>
              </div>
              {bet.status === "pending" && (
                <div className="flex gap-2">
                  <button onClick={() => handleCashout(bet.id)} disabled={cashingOutId === bet.id} className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-wb-primary/30 bg-wb-primary/10 py-2 text-xs font-bold text-wb-primary hover:bg-wb-primary/20 transition disabled:opacity-50">
                    {cashingOutId === bet.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Cash Out"}
                  </button>
                  <button disabled className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-wb-border-strong bg-wb-surface py-2 text-xs font-bold text-wb-muted cursor-not-allowed">
                    Edit Bet
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}