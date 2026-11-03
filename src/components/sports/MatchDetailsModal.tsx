"use client";

import { useState } from "react";
import { X, ChevronLeft } from "lucide-react";
import { Match } from "@/lib/bsd";
import { useBetSlipStore } from "@/store/betSlip";

export default function MatchDetailsModal({ match, onClose }: { match: Match; onClose: () => void; }) {
  const [activeTab, setActiveTab] = useState<"main" | "all">("main");
  const addSelection = useBetSlipStore((s) => s.addSelection);
  const isSelected = useBetSlipStore((s) => s.isSelected);

  const handleOddClick = (marketName: string, pick: string, odd: number) => {
    if (odd <= 0) return;
    addSelection({ matchId: Number(match.id), matchLabel: `${match.homeTeam} vs ${match.awayTeam}`, league: match.league, market: marketName, pick, odd });
  };

  // Filter markets for the "Main" tab
  const mainMarketIds = ["1x2", "ou_2_5", "btts"];
  const displayedMarkets = activeTab === "main" 
    ? match.markets.filter(m => mainMarketIds.includes(m.id))
    : match.markets;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 sm:px-4 sm:py-6" onClick={onClose}>
      <div 
        className="w-full h-full sm:h-auto sm:max-w-lg flex flex-col bg-wb-bg sm:rounded-2xl border border-wb-border shadow-2xl overflow-hidden animate-slide-up sm:animate-fade-up sm:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-wb-border bg-wb-surface">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="sm:hidden p-2 -ml-2 text-wb-muted hover:text-white">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white line-clamp-1">{match.homeTeam} vs {match.awayTeam}</h2>
              <p className="text-xs text-wb-muted">{match.league}</p>
            </div>
          </div>
          <button onClick={onClose} className="hidden sm:block rounded-lg p-2 text-wb-muted hover:bg-wb-bg hover:text-white transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-wb-border bg-wb-bg">
          <button onClick={() => setActiveTab("main")} className={`flex-1 py-3.5 text-sm font-bold text-center transition ${activeTab === "main" ? "text-wb-primary border-b-2 border-wb-primary" : "text-wb-muted hover:text-white"}`}>
            Main Markets
          </button>
          <button onClick={() => setActiveTab("all")} className={`flex-1 py-3.5 text-sm font-bold text-center transition ${activeTab === "all" ? "text-wb-primary border-b-2 border-wb-primary" : "text-wb-muted hover:text-white"}`}>
            All Markets ({match.markets.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 bg-wb-bg pb-safe space-y-6">
          {displayedMarkets.length === 0 ? (
            <p className="text-center text-wb-muted py-10">No markets available for this match.</p>
          ) : (
            displayedMarkets.map((market) => (
              <div key={market.id}>
                <h4 className="text-xs font-bold uppercase tracking-wider text-wb-muted mb-3">{market.name}</h4>
                <div className={`grid gap-2 ${market.outcomes.length === 2 ? "grid-cols-2" : market.outcomes.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
                  {market.outcomes.map((opt) => {
                    const selected = isSelected(Number(match.id), market.name, opt.label);
                    const hasOdds = opt.odds > 0;
                    return (
                      <button
                        key={opt.label}
                        onClick={() => handleOddClick(market.name, opt.label, opt.odds)}
                        disabled={!hasOdds}
                        className={`flex flex-col items-center justify-center py-3.5 rounded-lg border transition ${
                          selected ? "bg-wb-primary border-wb-primary text-black" : hasOdds ? "bg-wb-surface border-wb-border-strong text-white hover:border-wb-primary" : "bg-wb-bg border-wb-border text-wb-muted cursor-default"
                        }`}
                      >
                        <span className="text-xs font-medium mb-1">{opt.label}</span>
                        <span className="text-sm font-black tabular-nums">{hasOdds ? opt.odds.toFixed(2) : "—"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}