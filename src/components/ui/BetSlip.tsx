"use client";

import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, Trash2, X, Loader2 } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useBetSlipStore } from "@/store/betSlip";
import { useUserStore } from "@/store/userStore";
import { supabase } from "@/lib/supabase/client";
import BetReceiptModal from "./BetReceiptModal";

const MIN_STAKE = 200;

export default function BetSlip() {
  const router = useRouter();
  const pathname = usePathname(); // Hooks into URL changes
  
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
  const [error, setError] = useState<string | null>(null);
  
  const [receiptData, setReceiptData] = useState<{
    bookingCode: string;
    stake: number;
    totalOdds: number;
    potentialWin: number;
  } | null>(null);

  const stakeNum = parseFloat(stake) || 0;
  const totalOdds = useMemo(
    () => selections.reduce((acc, s) => acc * (s.odd || 1), 1),
    [selections]
  );
  const potentialWin = stakeNum * totalOdds;
  const valid = stakeNum >= MIN_STAKE && selections.length > 0 && stakeNum <= balance;

  // FIX: Safely close the bet slip when the URL changes (Back button)
  useEffect(() => {
    closeSlip();
  }, [pathname, closeSlip]);

  function quickAdd(amount: number) {
    const next = stakeNum + amount;
    setStake(next.toFixed(2));
  }

  async function handlePlaceBet() {
    if (!valid) return;
    setError(null);
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const res = await fetch("/api/bets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          selections,
          stake: stakeNum,
          totalOdds,
          potentialWin,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to place bet");

      deductBalance(stakeNum);
      
      setReceiptData({
        bookingCode: data.bookingCode,
        stake: stakeNum,
        totalOdds,
        potentialWin,
      });
      
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setLoading(false);
    }
  }

  function handleCloseReceipt() {
    setReceiptData(null);
    clearSlip();
    setStake("");
    closeSlip();
    setLoading(false);
    router.push("/my-bets");
  }

  if (!isOpen && !receiptData) return null;

  return (
    <>
      <div className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={closeSlip} />

      <aside className={`fixed z-50 flex flex-col bg-[#0A0A0A] shadow-2xl transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-y-0 lg:translate-x-0" : "translate-y-full lg:translate-y-0 lg:translate-x-full"}
        bottom-0 left-0 w-full h-[85vh] rounded-t-2xl
        lg:top-0 lg:right-0 lg:left-auto lg:h-full lg:w-[400px] lg:rounded-none lg:border-l lg:border-[#333333]
      `}>
        
        <div className="flex justify-center py-2 lg:hidden" onClick={closeSlip}>
          <div className="h-1.5 w-12 rounded-full bg-[#444444]" />
        </div>

        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#333333] px-4">
          <h2 className="text-base font-bold text-white">
            Bet Slip <span className="ml-2 rounded-full bg-[#00C853]/15 px-2 py-0.5 text-xs font-bold text-[#00C853]">{selections.length}</span>
          </h2>
          <div className="flex items-center gap-2">
            {selections.length > 0 && (
              <button onClick={() => { clearSlip(); setStake(""); }} className="text-xs font-bold text-gray-400 hover:text-red-500">Clear all</button>
            )}
            <button onClick={closeSlip} className="rounded-lg p-1.5 text-gray-400 hover:bg-[#1A1A1A] hover:text-white"><X className="h-5 w-5" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {selections.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-sm font-bold text-white">Your slip is empty</p>
              <p className="mt-1 text-xs text-gray-400">Tap any odd on a match to add a selection.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {selections.map((s) => (
                <li key={`${s.matchId}-${s.market}`} className="rounded-xl border border-[#333333] bg-[#1A1A1A] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{s.league}</p>
                      <p className="mt-0.5 truncate text-sm font-bold text-white">{s.matchLabel}</p>
                      <p className="mt-1 text-xs text-gray-400"><span className="font-bold text-[#00C853]">{s.pick}</span> · {s.market}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="rounded-lg bg-[#00C853]/15 px-2 py-1 text-sm font-black text-[#00C853] tabular-nums">{s.odd.toFixed(2)}</span>
                      <button onClick={() => removeSelection(s.matchId, s.market)} className="text-gray-400 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selections.length > 0 && (
          <div className="shrink-0 border-t border-[#333333] bg-[#0A0A0A] p-4 pb-safe">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase">Wallet Balance</span>
              <span className="text-sm font-black text-white">{symbol} {balance.toFixed(2)}</span>
            </div>

            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400">Stake (min {symbol} {MIN_STAKE})</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">{symbol}</span>
                <input type="number" inputMode="decimal" min={MIN_STAKE} value={stake} onChange={(e) => setStake(e.target.value)} placeholder={String(MIN_STAKE)} className="w-full rounded-xl border border-[#444444] bg-[#2A2A2A] py-3 pl-12 pr-3 text-sm font-bold text-white tabular-nums placeholder:text-gray-500 focus:border-[#00C853] focus:outline-none" />
              </div>
              <button onClick={() => setStake((prev) => Math.max(0, (parseFloat(prev) || 0) - 100).toFixed(2))} className="rounded-xl border border-[#444444] bg-[#1A1A1A] p-3 text-gray-400 hover:text-white"><Minus className="h-5 w-5" /></button>
              <button onClick={() => quickAdd(100)} className="rounded-xl border border-[#444444] bg-[#1A1A1A] p-3 text-gray-400 hover:text-white"><Plus className="h-5 w-5" /></button>
            </div>

            <div className="mt-2 flex gap-1.5">
              {[200, 500, 1000, 2000].map((amt) => (
                <button key={amt} onClick={() => setStake(String(amt))} className="flex-1 rounded-xl border border-[#444444] bg-[#1A1A1A] py-2 text-xs font-bold text-white hover:border-[#00C853] hover:text-[#00C853]">{symbol}{amt}</button>
              ))}
            </div>

            <div className="mt-4 space-y-1.5 rounded-xl border border-[#333333] bg-[#1A1A1A] p-3 text-sm">
              <div className="flex justify-between text-gray-400 font-medium">
                <span>Total Odds</span>
                <span className="font-bold text-white tabular-nums">{totalOdds.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-400 font-medium border-t border-[#333333] pt-1.5 mt-1.5">
                <span>Potential Win</span>
                <span className="font-black text-[#00C853] tabular-nums">{symbol} {potentialWin.toFixed(2)}</span>
              </div>
            </div>

            {error && <p className="mt-2 text-center text-xs text-red-500 font-bold">{error}</p>}
            {stakeNum > balance && <p className="mt-2 text-center text-xs text-red-500 font-bold">Insufficient balance.</p>}

            <button type="button" onClick={handlePlaceBet} disabled={!valid || loading} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#00C853] py-4 text-sm font-bold text-black transition hover:bg-[#00E676] disabled:cursor-not-allowed disabled:opacity-40">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Placing Bet…" : stakeNum > 0 && stakeNum < MIN_STAKE ? `Min stake ${symbol} ${MIN_STAKE}` : "Place Bet"}
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