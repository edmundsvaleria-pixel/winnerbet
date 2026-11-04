"use client";

import { useState } from "react";
import { X, ChevronLeft, Lock } from "lucide-react";
import { Match } from "@/lib/bsd";
import { useBetSlipStore } from "@/store/betSlip";

export default function MatchDetailsModal({ 
  match, 
  onClose 
}: { 
  match: Match & { isLocked?: boolean, currentScore?: { home: number, away: number } }; 
  onClose: () => void; 
}) {
  const [activeTab, setActiveTab] = useState<string>("All");
  const addSelection = useBetSlipStore((s) => s.addSelection);
  const isSelected = useBetSlipStore((s) => s.isSelected);

  const isFinished = match.status === "finished";

  const handleOddClick = (marketName: string, pick: string, odd: number) => {
    if (odd <= 0 || match.isLocked || isFinished) return;
    addSelection({ 
      matchId: Number(match.id), 
      matchLabel: `${match.homeTeam} vs ${match.awayTeam}`, 
      league: match.league, 
      market: marketName, 
      pick, 
      odd 
    });
  };

  const TABS = ["All", "Main", "Goals", "Half", "Bookings", "Corners", "Players", "Teams", "Minutes", "Match"];

  const displayedMarkets = (match.markets || []).filter((m) => 
    activeTab === "All" ? true : m.group === activeTab
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 sm:px-4 sm:py-6" onClick={onClose}>
      <div 
        className="w-full h-full sm:h-auto sm:max-w-xl flex flex-col bg-wb-bg sm:rounded-2xl border border-wb-border shadow-2xl overflow-hidden animate-slide-up sm:animate-fade-up sm:max-h-[90vh]" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-wb-border bg-wb-surface shrink-0">
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

        {/* Content States */}
        {isFinished ? (
          <div className="flex flex-col items-center justify-center p-10 flex-1 bg-wb-bg text-center">
             <div className="h-16 w-16 rounded-full bg-wb-surface flex items-center justify-center mb-4 border border-wb-border">
               <Lock className="h-8 w-8 text-wb-muted" />
             </div>
             <h3 className="text-lg font-bold text-white mb-2">Match Finished</h3>
             <p className="text-sm text-wb-muted mb-6">This match has ended and markets are closed.</p>
             
             {match.currentScore && (
               <div className="bg-wb-surface border border-wb-border-strong rounded-xl px-8 py-4">
                 <p className="text-xs text-wb-muted uppercase mb-2">Final Score</p>
                 <p className="text-3xl font-black text-white">
                   {match.currentScore.home} - {match.currentScore.away}
                 </p>
               </div>
             )}
          </div>
        ) : match.isLocked ? (
          <div className="flex flex-col items-center justify-center p-10 flex-1 bg-wb-bg text-center">
             <div className="h-16 w-16 rounded-full bg-yellow-500/10 flex items-center justify-center mb-4">
               <Lock className="h-8 w-8 text-yellow-500" />
             </div>
             <h3 className="text-lg font-bold text-white mb-2">Half Time</h3>
             <p className="text-sm text-wb-muted">Markets are temporarily suspended. They will reopen for the second half shortly.</p>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex overflow-x-auto border-b border-wb-border bg-wb-surface shrink-0 scrollbar-hide">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap px-4 py-3 text-xs font-bold transition border-b-2 ${
                    activeTab === tab 
                      ? "text-wb-primary border-wb-primary" 
                      : "text-wb-muted border-transparent hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Markets */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-wb-bg pb-safe space-y-6">
              {displayedMarkets.length === 0 ? (
                <p className="text-center text-wb-muted py-10">No markets available in this category.</p>
              ) : (
                displayedMarkets.map((market) => (
                  <div key={market.id}>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-wb-muted mb-3">{market.name}</h4>
                    <div className={`grid gap-2 ${market.outcomes.length === 2 ? "grid-cols-2" : market.outcomes.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
                      {market.outcomes.map((opt) => {
                        const selected = isSelected(Number(match.id), market.name, opt.label);
                        return (
                          <button 
                            key={opt.label} 
                            onClick={() => handleOddClick(market.name, opt.label, opt.odds)} 
                            className={`flex flex-col items-center justify-center py-3 rounded-lg border transition-all ${
                              selected 
                                ? "bg-wb-primary border-wb-primary text-black font-bold" 
                                : "bg-wb-surface border-wb-border-strong text-white hover:border-wb-primary"
                            }`}
                          >
                            <span className="text-[10px] text-center font-medium mb-1 opacity-80">{opt.label}</span>
                            <span className="text-sm font-black tabular-nums">{opt.odds.toFixed(2)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}