import { Match } from "./bsd";

const SPORTSCORE_BASE = "https://sportscore1.p.rapidapi.com/api/v1";
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || "";

export async function fetchSportScoreMatches(sport: string): Promise<Match[]> {
  const sportQuery = sport.toLowerCase() === "basketball" ? "basketball" : "tennis";
  
  try {
    const res = await fetch(`${SPORTSCORE_BASE}/events?sport=${sportQuery}&status=upcoming&limit=20`, {
      headers: {
        "X-RapidAPI-Key": RAPIDAPI_KEY,
        "X-RapidAPI-Host": "sportscore1.p.rapidapi.com"
      },
      next: { revalidate: 300 }, // Cache for 5 mins to save API calls
    });

    if (!res.ok) {
      console.error("SportScore API error:", res.status);
      return [];
    }
    
    const data = await res.json();
    const events = data.data || [];

    return events.map((event: any) => {
      // SportScore returns participants in an array
      const homePlayer = event.participants?.find((p: any) => p.qualifier === "home")?.name || "Player 1";
      const awayPlayer = event.participants?.find((p: any) => p.qualifier === "away")?.name || "Player 2";
      const league = event.tournament?.name || event.league || `${sportQuery} League`;

      return {
        id: event.id,
        league: league,
        homeTeam: homePlayer,
        awayTeam: awayPlayer,
        startTime: event.start_time || new Date().toISOString(),
        status: 'upcoming',
        source: 'sportscore',
        markets: [
          {
            id: "1x2",
            name: "Match Winner",
            outcomes: [
              { label: "Home", odds: 1.80 }, // Fallback odds since free tier lacks odds
              { label: "Away", odds: 2.00 }
            ]
          }
        ]
      };
    });
  } catch (error) {
    console.error("SportScore fetch error:", error);
    return [];
  }
}