// src/lib/sportscore.ts
import { Match } from "./bsd";

const SPORTSCORE_BASE = "https://sportscore.com/api/v1";

export async function fetchSportScoreMatches(sport: string): Promise<Match[]> {
  const sportQuery = sport.toLowerCase() === "basketball" ? "basketball" : "tennis";
  
  try {
    const res = await fetch(
      `${SPORTSCORE_BASE}/matches?sport=${sportQuery}&limit=20`, 
      {
        headers: { "Accept": "application/json" },
        cache: 'no-store',
      }
    );

    if (!res.ok) return [];
    
    const data = await res.json();
    const events = data.data || data.matches || [];

    // Filter to only show upcoming matches if the API provides status
    return events
      .filter((e: any) => e.status === 'upcoming' || e.status === 'scheduled' || !e.status)
      .map((event: any) => ({
        id: event.id || String(Math.random()),
        league: event.tournament?.name || event.league || `${sportQuery} League`,
        homeTeam: event.home_team || "Home",
        awayTeam: event.away_team || "Away",
        homeOdds: 0, // SportScore free tier may not provide odds
        drawOdds: 0,
        awayOdds: 0,
        overOdds: 0,
        underOdds: 0,
        bttsYes: 0,
        bttsNo: 0,
        startTime: event.startTime || event.date || new Date().toISOString(),
        status: 'upcoming',
        source: 'bsd', // Use 'bsd' so it doesn't break the UI badge
      }));
  } catch (error) {
    console.error("SportScore fetch error:", error);
    return [];
  }
}