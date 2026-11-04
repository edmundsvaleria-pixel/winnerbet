"use client";

import { useMemo, useState, useEffect } from "react";
import { Minus, Plus, Trash2, X, Loader2, Share2, Settings } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useBetSlipStore } from "@/store/betSlip";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/lib/supabase/client";
import BetReceiptModal from "./BetReceiptModal";
import Toast from "./Toast";

const MIN_STAKE = 200;

export default function BetSlip() {
  const router = useRouter();
  const pathname = usePathname();
  
  const isOpen = useBetSlipStore((s) => s.isOpen);
  const closeSlip = useBetSlipStore((s) => s.closeSlip);
  const selections = useBetSlipStore((s) => s.selections);
  const removeSelection = useBetSlipStore((s) => s.removeSelection);
  const clearSlip = useBetSlipStore((s) => s.clearSlip);
  
  const symbol = useUserStore((s) => s.symbol);
  const balance = useUserStore((s) => s.balance);
  const deductBalance = useUserStore((s) => s.deductBalance);

  const [stake, setStake] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [autoAccept, setAutoAccept] = useState(true); // NEW: Auto-Accept
  const [isSimulated, setIsSimulated] = useState(false); // NEW: SIM mode
  
  const [receiptData, setReceiptData] = useState<{ bookingCode: string; stake: number; totalOdds: number; potentialWin: number; } | null>(null);

  const stakeNum = parseFloat(stake) || 0;
  const totalOdds = useMemo(() => selections.reduce((acc, s) => acc * (s.odd || 1), 1), [selections]);
  const potentialWin = stakeNum * totalOdds;
  const valid = stakeNum >= MIN_STAKE && selections.length > 0 && (isSimulated || stakeNum <= balance);

  useEffect(() => { closeSlip(); }, [pathname, closeSlip]);

  function quickAdd(amount: number) {
    const next = stakeNum + amount;
    setStake(next.toFixed(2));
  }

  async function handlePlaceBet() {
    if (!valid) return;
    setLoading(true);

    try {
      if (isSimulated) {
        // SIMULATED BET: Just show receipt, don't touch DB
        await new Promise(r => setTimeout(r, 800)); // Fake delay
        setReceiptData({ bookingCode: "SIM-" + Math.random().toString(36).substring(2, 6).toUpperCase(), stake: stakeNum, totalOdds, potentialWin });
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const res = await fetch("/api/bets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, selections, stake: stakeNum, totalOdds, potentialWin }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to place bet");

      deductBalance(stakeNum);
      setReceiptData({ bookingCode: data.bookingCode, stake: stakeNum, totalOdds, potentialWin });
    } catch (err: any) {
      setToast({ msg: err.message || "Something went wrong.", type: "error" });
      setLoading(false);
    }
  }

  function handleCloseReceipt() {
    setReceiptData(null);
    clearSlip();
    setStake("");
    closeSlip();
    setLoading(false);
    if (!isSimulated) router.push("/my-bets");
  }

  // NEW: Copy Booking Code
  function handleShareCode() {
    const code = "BK-" + Math.random().toString(36).substring(2, 9).toUpperCase();
    navigator.clipboard.writeText(code);
    setToast({ msg: `Booking code ${code} copied!`, type: "success" });
  }

  if (!isOpen && !receiptData) return null;

  return (
    <>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={closeSlip} />

      <aside className={`fixed z-50 flex flex-col bg-wb-bg shadow-2xl transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-y-0 lg:translate-x-0" : "translate-y-full lg:translate-y-0 lg:translate-x-full"}
        bottom-0 left-0 w-full h-[85vh] rounded-t-2xl lg:top-0 lg:right-0 lg:left-auto lg:h-full lg:w-[400px] lg:rounded-none lg:border-l lg:border-wb-border
      `}>
        <div className="flex justify-center py-2 lg:hidden" onClick={closeSlip}><div className="h-1.5 w-12 rounded-full bg-wb-border-strong" /></div>

        {/* Header with SIM & Share */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-wb-border px-4">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-white">Bet Slip</h2>
            <span className="rounded-full bg-wb-primary/15 px-2 py-0.5 text-xs font-bold text-wb-primary">{selections.length}</span>
            
            {/* SIM Toggle */}
            <button onClick={() => setIsSimulated(!isSimulated)} className={`text-[10px] font-bold px-2 py-1 rounded border transition ${isSimulated ? "bg-yellow-500/20 border-yellow-500 text-yellow-500" : "bg-transparent border-wb-border text-wb-muted"}`}>
              {isSimulated ? "SIM ON" : "SIM OFF"}
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={handleShareCode} disabled={selections.length === 0} className="text-wb-muted hover:text-white disabled:opacity-30"><Share2 className="h-4 w-4" /></button>
            <button onClick={closeSlip} className="rounded-lg p-1.5 text-wb-muted hover:bg-wb-surface hover:text-white"><X className="h-5 w-5" /></button>
          </div>
        </div>

        {/* Odds Auto-Accept Notice */}
        <div className="flex items-center justify-between bg-wb-surface px-4 py-2 border-b border-wb-border">
          <div className="flex items-center gap-2 text-[11px] text-wb-muted">
            <Settings className="h-3.5 w-3.5" /> Accept odds changes automatically?
          </div>
          <button onClick={() => setAutoAccept(!autoAccept)} className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${autoAccept ? "bg-wb-primary" : "bg-wb-border-strong"}`}>
            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${autoAccept ? "translate-x-4" : "translate-x-1"}`} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {selections.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-sm font-bold text-white">Your slip is empty</p>
              <p className="mt-1 text-xs text-wb-muted">Tap any odd on a match to add a selection.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {selections.map((s) => (
                <li key={`${s.matchId}-${s.market}`} className="rounded-xl border border-wb-border bg-wb-surface p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-wb-muted">{s.league}</p>
                      <p className="mt-0.5 truncate text-sm font-bold text-white">{s.matchLabel}</p>
                      <p className="mt-1 text-xs text-wb-muted"><span className="font-bold text-wb-primary">{s.pick}</span> · {s.market}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="rounded-lg bg-wb-primary/15 px-2 py-1 text-sm font-black text-wb-primary tabular-nums">{s.odd.toFixed(2)}</span>
                      <button onClick={() => removeSelection(s.matchId, s.market)} className="text-wb-muted hover:text-wb-danger"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selections.length > 0 && (
          <div className="shrink-0 border-t border-wb-border bg-wb-bg p-4 pb-safe">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-wb-muted uppercase">Wallet Balance</span>
              <span className="text-sm font-black text-white">{symbol} {balance.toFixed(2)}</span>
            </div>

            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-wb-muted">Stake (min {symbol} {MIN_STAKE})</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-wb-muted">{symbol}</span>
                <input type="number" inputMode="decimal" min={MIN_STAKE} value={stake} onChange={(e) => setStake(e.target.value)} placeholder={String(MIN_STAKE)} className="w-full rounded-xl border border-wb-border-strong bg-wb-sub py-3 pl-12 pr-3 text-sm font-bold text-white tabular-nums placeholder:text-wb-muted focus:border-wb-primary focus:outline-none" />
              </div>
              <button onClick={() => setStake((prev) => Math.max(0, (parseFloat(prev) || 0) - 100).toFixed(2))} className="rounded-xl border border-wb-border-strong bg-wb-surface p-3 text-wb-muted hover:text-white"><Minus className="h-5 w-5" /></button>
              <button onClick={() => quickAdd(100)} className="rounded-xl border border-wb-border-strong bg-wb-surface p-3 text-wb-muted hover:text-white"><Plus className="h-5 w-5" /></button>
            </div>

            <div className="mt-2 flex gap-1.5">
              {[200, 500, 1000, 2000].map((amt) => (
                <button key={amt} onClick={() => setStake(String(amt))} className="flex-1 rounded-xl border border-wb-border-strong bg-wb-surface py-2 text-xs font-bold text-white hover:border-wb-primary hover:text-wb-primary">{symbol}{amt}</button>
              ))}
            </div>

            <div className="mt-4 space-y-1.5 rounded-xl border border-wb-border bg-wb-surface p-3 text-sm">
              <div className="flex justify-between text-wb-muted font-medium">
                <span>Total Odds</span>
                <span className="font-bold text-white tabular-nums">{totalOdds.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-wb-muted font-medium border-t border-wb-border pt-1.5 mt-1.5">
                <span>Potential Win</span>
                <span className="font-black text-wb-primary tabular-nums">{symbol} {potentialWin.toFixed(2)}</span>
              </div>
            </div>

            {stakeNum > balance && !isSimulated && <p className="mt-2 text-center text-xs text-wb-danger font-bold">Insufficient balance.</p>}

            <button type="button" onClick={handlePlaceBet} disabled={!valid || loading} className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold transition disabled:opacity-40 ${isSimulated ? "bg-yellow-500 hover:bg-yellow-400 text-black" : "bg-wb-primary hover:bg-wb-primary-hover text-black"}`}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Processing…" : isSimulated ? "Place SIM Bet (No Money)" : `Place Bet`}
            </button>
          </div>
        )}
      </aside>

      {receiptData && (
        <BetReceiptModal isOpen={!!receiptData} onClose={handleCloseReceipt} bookingCode={receiptData.bookingCode} stake={receiptData.stake} totalOdds={receiptData.totalOdds} potentialWin={receiptData.potentialWin} symbol={symbol} />
      )}
    </>
  );
}