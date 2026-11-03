"use client";

import { useEffect, useState } from "react";
import { Match } from "@/lib/bsd";
import { Loader2, CalendarDays } from "lucide-react";
import Link from "next/link";

export default function SchedulePage({ params }: { params: { sport: string } }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/sports");
        if (res.ok) {
          const data = await res.json();
          // Only show upcoming matches for the schedule
          setMatches(data.filter((m: Match) => m.status === "upcoming"));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.sport]);

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-wb-primary" /></div>;
  }

  // Group matches by league
  const grouped = matches.reduce((acc, match) => {
    if (!acc[match.league]) acc[match.league] = [];
    acc[match.league].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <CalendarDays className="h-6 w-6 text-wb-primary" />
        <h1 className="text-2xl font-bold text-white capitalize">{params.sport} Schedule</h1>
      </div>

      <div className="space-y-8">
        {Object.keys(grouped).length === 0 ? (
          <p className="text-wb-muted text-center py-10">No upcoming fixtures available.</p>
        ) : (
          Object.entries(grouped).map(([league, leagueMatches]) => (
            <div key={league}>
              <h2 className="text-sm font-bold text-wb-muted uppercase tracking-wider mb-3 border-b border-wb-border pb-2">
                {league}
              </h2>
              <div className="space-y-2">
                {leagueMatches.map((match) => (
                  <div key={match.id} className="flex items-center justify-between rounded-lg border border-wb-border bg-wb-surface p-3 hover:border-wb-border-strong transition">
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">{match.homeTeam}</p>
                      <p className="text-sm font-semibold text-white truncate">{match.awayTeam}</p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-xs text-wb-muted">
                        {new Date(match.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-sm font-bold text-wb-primary">
                        {new Date(match.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}