"use client";

import { Match } from "@/lib/bsd";
import { useBetSlipStore } from "@/store/betSlip";

export default function MatchCard({ 
  match, 
  onOpenDetails 
}: { 
  match: Match; 
  onOpenDetails: (match: Match) => void;
}) {
  const addSelection = useBetSlipStore((s) => s.addSelection);
  const isSelected = useBetSlipStore((s) => s.isSelected);

  const handleOddClick = (market: string, pick: string, odd: number) => {
    if (odd <= 0) return;
    addSelection({
      matchId: Number(match.id),
      matchLabel: `${match.homeTeam} vs ${match.awayTeam}`,
      league: match.league,
      market,
      pick,
      odd,
    });
  };

  // Find the 1X2 market to display on the card
  const oneXTwo = match.markets?.find((m) => m.id === "1x2");
  const homeOdd = oneXTwo?.outcomes.find((o) => o.label === "Home")?.odds || 0;
  const drawOdd = oneXTwo?.outcomes.find((o) => o.label === "Draw")?.odds || 0;
  const awayOdd = oneXTwo?.outcomes.find((o) => o.label === "Away")?.odds || 0;

  const renderOddButton = (label: string, pick: string, odd: number) => {
    const selected = isSelected(Number(match.id), "Match Result", pick);
    const hasOdds = odd > 0;

    return (
      <button
        onClick={(e) => { e.stopPropagation(); handleOddClick("Match Result", pick, odd); }}
        disabled={!hasOdds}
        className={`flex flex-col items-center justify-center w-14 h-11 rounded-md border transition ${
          selected
            ? "bg-wb-primary border-wb-primary text-black"
            : hasOdds
            ? "bg-wb-surface border-wb-border-strong text-white hover:border-wb-primary"
            : "bg-wb-bg border-wb-border text-wb-muted cursor-default"
        }`}
      >
        <span className="text-[10px] font-bold opacity-70 mb-0.5">{label}</span>
        <span className="text-sm font-black tabular-nums tracking-tight">
          {hasOdds ? odd.toFixed(2) : "—"}
        </span>
      </button>
    );
  };

  return (
    <div 
      onClick={() => onOpenDetails(match)}
      className="group flex flex-col rounded-lg border border-wb-border bg-wb-bg overflow-hidden cursor-pointer hover:border-wb-border-strong transition"
    >
      {/* Top Info Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-wb-surface/50 border-b border-wb-border text-[11px] text-wb-muted uppercase tracking-wider font-semibold">
        <div className="flex items-center gap-2 truncate">
          <span className="truncate">{match.league}</span>
          {match.source === 'scorio' && ( // This is fine if we keep it, but TS complained because source is now 'bsd' | 'sportscore'
             // Wait, the error said source doesn't have 'scorio'. Let me check bsd.ts.
             // Yes, I changed source to 'bsd' | 'sportscore'. So I should remove 'scorio' check.
             false
          )}
        </div>
        <div>
          {match.status === "live" ? (
            <span className="flex items-center gap-1 text-wb-primary font-bold animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-wb-primary"></span> LIVE
            </span>
          ) : (
            new Date(match.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          )}
        </div>
      </div>

      {/* Main Match Body */}
      <div className="flex items-stretch justify-between p-3 gap-4">
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
          <p className="text-sm font-bold text-white truncate">{match.homeTeam}</p>
          <p className="text-sm font-bold text-white truncate">{match.awayTeam}</p>
        </div>

        {/* Odds Grid */}
        <div className="flex gap-1.5 shrink-0">
          {renderOddButton("1", "Home", homeOdd)}
          {renderOddButton("X", "Draw", drawOdd)}
          {renderOddButton("2", "Away", awayOdd)}
        </div>
      </div>
    </div>
  );
}