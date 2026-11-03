// src/lib/bsd.ts
import { generateMarkets, fluctuateOdds, MarketOdds } from "./odds-engine";

export interface Match {
  id: number | string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  status: 'upcoming' | 'live' | 'finished';
  markets: MarketOdds[]; // Replaces flat homeOdds, drawOdds, etc.
  source: 'bsd' | 'sportscore';
}

const BSD_API_KEY = process.env.NEXT_PUBLIC_BSD_API_KEY;
const BASE_URL = "https://sports.bzzoiro.com/api/v2";

export async function fetchMatches(): Promise<Match[]> {
  if (!BSD_API_KEY) return [];

  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  try {
    const res = await fetch(`${BASE_URL}/events/?date_from=${today}&date_to=${nextWeek}&status=upcoming`, {
      headers: { Authorization: `Token ${BSD_API_KEY}` },
      cache: 'no-store',
    });
    
    if (!res.ok) return [];
    const data = await res.json();
    const events = data.results || [];
    const now = Date.now();

    return events.map((event: any) => {
      // 1. Get Raw 1X2 from Feed
      const rawHome = event.odds?.home_win || 0;
      const rawDraw = event.odds?.draw || 0;
      const rawAway = event.odds?.away_win || 0;

      // 2. Generate Full Markets (If raw odds exist)
      let markets: MarketOdds[] = [];
      if (rawHome > 1 && rawDraw > 1 && rawAway > 1) {
        markets = generateMarkets(rawHome, rawDraw, rawAway);
        
        // 3. Apply Dynamic Fluctuation to all generated markets
        const diffMins = (now - new Date(event.event_date).getTime()) / 60000;
        const virtualLiability = Math.random() * 2; // Simulate random money flow

        markets = markets.map(m => ({
          ...m,
          outcomes: m.outcomes.map(o => ({
            ...o,
            odds: fluctuateOdds(o.odds, diffMins > 0 ? diffMins : 0, virtualLiability)
          }))
        }));
      }

      return {
        id: event.id,
        league: event.league?.name || "Other",
        homeTeam: event.home_team || "Home",
        awayTeam: event.away_team || "Away",
        startTime: event.event_date,
        status: 'upcoming',
        markets,
        source: 'bsd',
      };
    });
  } catch (error) {
    console.error("BSD fetch error:", error);
    return [];
  }
}