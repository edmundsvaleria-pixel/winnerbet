"use client";

import { CheckCircle2, Share2 } from "lucide-react";

export default function BetReceiptModal({
  isOpen,
  onClose,
  bookingCode,
  stake,
  potentialWin,
  totalOdds,
  symbol,
}: {
  isOpen: boolean;
  onClose: () => void;
  bookingCode: string;
  stake: number;
  potentialWin: number;
  totalOdds: number;
  symbol: string;
}) {
  if (!isOpen) return null;

  function handleCopy() {
    navigator.clipboard.writeText(bookingCode);
    alert("Booking code copied!");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-wb-border bg-wb-surface p-6 text-center animate-fade-up">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-wb-primary/15">
          <CheckCircle2 className="h-8 w-8 text-wb-primary" />
        </div>
        
        <h2 className="text-xl font-bold text-white">Bet Placed!</h2>
        <p className="text-sm text-wb-muted mt-1">Your bet has been accepted successfully.</p>

        <div className="my-6 rounded-xl border border-wb-border-strong bg-wb-bg p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-wb-muted mb-1">Booking Code</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-black text-white tracking-widest">{bookingCode}</span>
            <button onClick={handleCopy} className="text-wb-primary hover:text-wb-primary-hover p-1">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2 text-sm mb-6">
          <div className="flex justify-between text-wb-muted">
            <span>Stake</span>
            <span className="text-white font-semibold">{symbol} {stake.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-wb-muted">
            <span>Total Odds</span>
            <span className="text-white font-semibold">{totalOdds.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-wb-muted border-t border-wb-border pt-2">
            <span>Potential Win</span>
            <span className="text-wb-primary font-bold">{symbol} {potentialWin.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-xl bg-wb-primary py-3 text-sm font-bold text-black transition hover:bg-wb-primary-hover"
        >
          View My Bets
        </button>
      </div>
    </div>
  );
}
