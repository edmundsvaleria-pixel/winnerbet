// src/app/api/sports/route.ts
import { NextResponse } from "next/server";
import { fetchMatches, Match } from "@/lib/bsd";
import { fetchSportScoreMatches } from "@/lib/sportscore";
import { generateMarkets } from "@/lib/odds-engine";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic'; // <-- THIS IS THE FIX

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sport = searchParams.get("sport") || "football";

  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let allMatches: Match[] = [];

    if (sport === "football") {
      allMatches = await fetchMatches();
    } else if (sport === "basketball") {
      allMatches = await fetchSportScoreMatches(sport);
    }

    // Fetch Custom Matches from Supabase
    const { data: customMatches } = await supabaseAdmin
      .from("matches")
      .select("*")
      .eq("status", "upcoming")
      .eq("sport", sport);

    if (customMatches && customMatches.length > 0) {
      const mappedCustom: Match[] = customMatches.map((m: any) => {
        let markets = [];
        if (Number(m.home_odds) > 1 && Number(m.draw_odds) > 1 && Number(m.away_odds) > 1) {
          markets = generateMarkets(Number(m.home_odds), Number(m.draw_odds), Number(m.away_odds));
        }
        return {
          id: m.id,
          league: m.league,
          homeTeam: m.home_team,
          awayTeam: m.away_team,
          startTime: m.start_time,
          status: "upcoming",
          source: "bsd",
          markets: markets,
        };
      });
      allMatches = [...mappedCustom, ...allMatches];
    }

    allMatches.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    return NextResponse.json(allMatches);
  } catch (error) {
    console.error("Sports API Route Error:", error);
    // Return an empty array instead of crashing so the frontend doesn't break
    return NextResponse.json([], { status: 200 });
  }
}