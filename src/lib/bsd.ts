// src/lib/bsd.ts
import { generateMarkets, fluctuateOdds, MarketOdds } from "./odds-engine";

export interface Match {
  id: number | string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  status: 'upcoming' | 'live' | 'finished';
  markets: MarketOdds[];
  source: 'bsd' | 'sportscore';
}

const BSD_API_KEY = process.env.NEXT_PUBLIC_BSD_API_KEY;
const BASE_URL = "https://sports.bzzoiro.com/api/v2";

export async function fetchMatches(): Promise<Match[]> {
  if (!BSD_API_KEY) return [];

  // Calculate Yesterday, Today, and Tomorrow
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  const nextWeek = new Date(); nextWeek.setDate(today.getDate() + 7);
  
  const dateFrom = yesterday.toISOString().split('T')[0];
  const dateTo = nextWeek.toISOString().split('T')[0];

  try {
    // We REMOVED the `status=upcoming` filter so live and finished games are returned
    const res = await fetch(`${BASE_URL}/events/?date_from=${dateFrom}&date_to=${dateTo}`, {
      headers: { 
        "Authorization": `Token ${BSD_API_KEY}`,
        "Accept": "application/json"
      },
      cache: 'no-store',
    });
    
    if (!res.ok) return [];
    const data = await res.json();
    const events = data.results || [];
    const now = Date.now();

    return events.map((event: any) => {
      let rawHome = Number(event.odds_home) || 0;
      let rawDraw = Number(event.odds_draw) || 0;
      let rawAway = Number(event.odds_away) || 0;

      if (rawHome <= 1) { rawHome = 2.00; rawDraw = 3.20; rawAway = 3.50; }

      let markets: MarketOdds[] = generateMarkets(rawHome, rawDraw, rawAway);
      const diffMins = (now - new Date(event.event_date).getTime()) / 60000;
      
      let status: 'upcoming' | 'live' | 'finished' = 'upcoming';
      if (diffMins > 120) status = 'finished';
      else if (diffMins >= 0) status = 'live';

      markets = markets.map(m => ({
        ...m,
        outcomes: m.outcomes.map(o => ({
          ...o,
          odds: fluctuateOdds(o.odds, diffMins > 0 ? diffMins : 0, Math.random() * 2)
        }))
      }));

      return {
        id: event.id,
        league: event.league?.name || "Other",
        homeTeam: event.home_team || "Home",
        awayTeam: event.away_team || "Away",
        startTime: event.event_date,
        status,
        markets,
        source: 'bsd',
      };
    });
  } catch (error) {
    console.error("BSD error:", error);
    return [];
  }
}
