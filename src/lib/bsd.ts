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
  if (!BSD_API_KEY) {
    console.error("❌ BSD API Key is missing in .env.local");
    return [];
  }

  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  try {
    console.log(`⏳ Fetching BSD matches for ${today} to ${nextWeek}...`);
    
    const res = await fetch(`${BASE_URL}/events/?date_from=${today}&date_to=${nextWeek}&status=upcoming`, {
      headers: { 
        "Authorization": `Token ${BSD_API_KEY}`,
        "Accept": "application/json"
      },
      cache: 'no-store',
    });
    
    if (!res.ok) {
      console.error(`❌ BSD API Error: ${res.status} ${res.statusText}`);
      return [];
    }

    const data = await res.json();
    const events = data.results || [];
    console.log(`✅ BSD returned ${events.length} matches.`);

    const now = Date.now();

    return events.map((event: any) => {
      // 1. Read flat BSD fields
      let rawHome = Number(event.odds_home) || 0;
      let rawDraw = Number(event.odds_draw) || 0;
      let rawAway = Number(event.odds_away) || 0;

      // 2. Fallback to default odds if API returns 0 (Missing Odds)
      // This ensures the UI and Markets Engine always have something to render.
      if (rawHome <= 1 || rawDraw <= 1 || rawAway <= 1) {
        rawHome = 2.00;
        rawDraw = 3.20;
        rawAway = 3.50;
      }

      // 3. Generate Markets
      let markets: MarketOdds[] = generateMarkets(rawHome, rawDraw, rawAway);
      
      // 4. Apply Dynamic Fluctuation based on match time
      const diffMins = (now - new Date(event.event_date).getTime()) / 60000;
      const virtualLiability = Math.random() * 2;

      markets = markets.map(m => ({
        ...m,
        outcomes: m.outcomes.map(o => ({
          ...o,
          odds: fluctuateOdds(o.odds, diffMins > 0 ? diffMins : 0, virtualLiability)
        }))
      }));

      return {
        id: event.id,
        league: event.league?.name || event.league_name || "Other",
        homeTeam: event.home_team || "Home",
        awayTeam: event.away_team || "Away",
        startTime: event.event_date,
        status: 'upcoming',
        markets,
        source: 'bsd',
      };
    });
  } catch (error) {
    console.error("❌ BSD fetch error:", error);
    return [];
  }
}