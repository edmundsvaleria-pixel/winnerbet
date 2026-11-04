"use client";

import { Match } from "@/lib/bsd";
import { useBetSlipStore } from "@/store/betSlip";

export default function MatchCard({ 
  match, 
  onOpenDetails 
}: { 
  match: Match & { isLocked?: boolean, currentScore?: { home: number, away: number }, currentMinute?: number }; 
  onOpenDetails: (match: Match) => void; 
}) {
  const addSelection = useBetSlipStore((s) => s.addSelection);
  const isSelected = useBetSlipStore((s) => s.isSelected);

  const handleOddClick = (market: string, pick: string, odd: number) => {
    if (odd <= 0 || match.isLocked) return;
    addSelection({ 
      matchId: Number(match.id), 
      matchLabel: `${match.homeTeam} vs ${match.awayTeam}`, 
      league: match.league, 
      market, 
      pick, 
      odd 
    });
  };

  const oneXTwo = match.markets?.find((m) => m.id === "1x2");
  const homeOdd = oneXTwo?.outcomes.find((o) => o.label === "Home")?.odds || 0;
  const drawOdd = oneXTwo?.outcomes.find((o) => o.label === "Draw")?.odds || 0;
  const awayOdd = oneXTwo?.outcomes.find((o) => o.label === "Away")?.odds || 0;

  const getLogo = (team: string) => 
    `https://logo.clearbit.com/${team.toLowerCase().replace(/\s+/g, '')}.com`;

  const renderOddButton = (label: string, pick: string, odd: number) => {
    const selected = isSelected(Number(match.id), "Match Result", pick);
    const hasOdds = odd > 0;

    return (
      <button
        onClick={(e) => { e.stopPropagation(); handleOddClick("Match Result", pick, odd); }}
        disabled={!hasOdds || match.isLocked}
        className={`flex flex-col items-center justify-center w-14 h-11 rounded-md border transition-all ${
          selected 
            ? "bg-wb-primary border-wb-primary text-black font-bold shadow-[0_0_10px_rgba(0,200,83,0.3)]" 
            : hasOdds 
            ? "bg-wb-surface border-wb-border-strong text-white hover:border-wb-primary" 
            : "bg-wb-bg border-wb-border text-wb-muted cursor-default"
        } ${match.isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span className="text-[10px] font-bold opacity-70 mb-0.5">{label}</span>
        <span className="text-sm font-black tabular-nums tracking-tight">
          {hasOdds && !match.isLocked ? odd.toFixed(2) : "—"}
        </span>
      </button>
    );
  };

  const showScore = match.status === "live" || match.status === "finished";
  const score = match.currentScore || { home: 0, away: 0 };

  return (
    <div 
      onClick={() => onOpenDetails(match)} 
      className="group flex flex-col rounded-lg border border-wb-border bg-wb-bg overflow-hidden cursor-pointer hover:border-wb-border-strong transition"
    >
      <div className="flex items-center justify-between px-3 py-1.5 bg-wb-surface/50 border-b border-wb-border text-[11px] text-wb-muted uppercase tracking-wider font-semibold">
        <span className="truncate">{match.league}</span>
        <span className="flex items-center gap-2">
          {match.isLocked ? (
            <span className="text-yellow-500 font-bold">🔒 HT</span>
          ) : match.status === "live" ? (
            <span className="text-wb-danger font-bold animate-pulse">● {match.currentMinute || 0}'</span>
          ) : (
            new Date(match.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          )}
        </span>
      </div>

      <div className="flex items-stretch justify-between p-3 gap-3">
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
               <img src={getLogo(match.homeTeam)} alt={match.homeTeam} className="w-5 h-5 rounded-full bg-wb-surface border border-wb-border-strong" onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${match.homeTeam[0]}&background=1A1A1A&color=00C853` }} />
               <p className="text-sm font-bold text-white truncate">{match.homeTeam}</p>
            </div>
            {showScore && <span className="text-sm font-black text-wb-primary">{score.home}</span>}
          </div>
          <div className="flex items-center justify-between gap-2">
             <div className="flex items-center gap-2">
               <img src={getLogo(match.awayTeam)} alt={match.awayTeam} className="w-5 h-5 rounded-full bg-wb-surface border border-wb-border-strong" onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${match.awayTeam[0]}&background=1A1A1A&color=00C853` }} />
               <p className="text-sm font-bold text-white truncate">{match.awayTeam}</p>
            </div>
            {showScore && <span className="text-sm font-black text-wb-primary">{score.away}</span>}
          </div>
        </div>

        <div className="flex gap-1.5 shrink-0">
          {renderOddButton("1", "Home", homeOdd)}
          {renderOddButton("X", "Draw", drawOdd)}
          {renderOddButton("2", "Away", awayOdd)}
        </div>
      </div>
    </div>
  );
}