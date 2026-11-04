"use client";

import { useState } from "react";
import { Receipt, Search, X } from "lucide-react";
import { useBetSlipStore } from "@/store/betSlip";
import { useRouter } from "next/navigation";

export default function FloatingBetButton() {
  const router = useRouter();
  const count = useBetSlipStore((s) => s.selections.length);
  const totalOdds = useBetSlipStore((s) => s.totalOdds());
  const toggleSlip = useBetSlipStore((s) => s.toggleSlip);
  const isOpen = useBetSlipStore((s) => s.isOpen);

  const [showSearch, setShowSearch] = useState(false);
  const [code, setCode] = useState("");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleButtonClick() {
    if (count > 0) {
      toggleSlip();
    } else {
      setShowSearch(true);
    }
  }

  async function handleLoadCode(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setSearching(true);
    setError(null);

    try {
      // Try loading as Booking Code
      const res = await fetch(`/api/bets/load?code=${code.trim().toUpperCase()}`);
      if (res.ok) {
        router.push("/my-bets");
        setShowSearch(false);
        return;
      }
      
      // Try loading as Ticket ID
      const res2 = await fetch(`/api/bets/track?ticketId=${code.trim()}`);
      if (res2.ok) {
        router.push("/my-bets");
        setShowSearch(false);
        return;
      }

      setError("Invalid Booking Code or Ticket ID.");
    } catch {
      setError("Failed to load code.");
    } finally {
      setSearching(false);
    }
  }

  if (isOpen) return null;

  return (
    <>
      {/* Always Visible Button */}
      <button
        type="button"
        onClick={handleButtonClick}
        className="fixed bottom-20 right-4 z-40 flex items-center gap-3 rounded-full bg-wb-primary px-5 py-3.5 text-black shadow-2xl shadow-wb-primary/20 transition hover:bg-wb-primary-hover active:scale-95 lg:bottom-6 lg:right-6"
      >
        <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-black/10">
          {count > 0 ? <Receipt className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          {count > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-[10px] font-bold text-wb-primary">
              {count}
            </span>
          )}
        </span>
        <span className="text-sm font-bold">
          {count > 0 ? `Bet Slip · ${totalOdds.toFixed(2)}` : "Load Code"}
        </span>
      </button>

      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4" onClick={() => setShowSearch(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-wb-border bg-wb-surface p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Load Bet</h2>
              <button onClick={() => setShowSearch(false)} className="text-wb-muted hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <p className="text-sm text-wb-muted mb-4">Enter a Booking Code or Ticket ID to load your bet.</p>
            <form onSubmit={handleLoadCode} className="space-y-3">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. ABCDEFG or 123456"
                className="w-full rounded-xl border border-wb-border-strong bg-wb-sub px-4 py-3 text-sm text-white focus:border-wb-primary focus:outline-none"
              />
              {error && <p className="text-xs text-wb-danger">{error}</p>}
              <button type="submit" disabled={searching || !code} className="w-full rounded-xl bg-wb-primary py-3 text-sm font-bold text-black hover:bg-wb-primary-hover disabled:opacity-50">
                {searching ? "Searching..." : "Load"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}